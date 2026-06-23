from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Answer,
    Category,
    Group,
    GroupCohesivity,
    GroupGroupSim,
    Person,
    PersonGroupSim,
    PersonPersonSim,
    Question,
    question_category,
)
from app.schemas import (
    AnswerOut,
    CategoryOut,
    GroupComparisonOut,
    GroupDetailOut,
    GroupListOut,
    GroupSummaryOut,
    PaginatedPeopleOut,
    PersonDetailOut,
    PersonOut,
    QuestionOut,
    SimilarGroupOut,
    SimilarPersonOut,
)

router = APIRouter()


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.id))
    return result.scalars().all()


@router.get("/questions", response_model=list[QuestionOut])
async def list_questions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).order_by(Question.id))
    questions = result.scalars().all()

    out = []
    for q in questions:
        cat_result = await db.execute(
            select(question_category.c.category_id)
            .where(question_category.c.question_id == q.id)
            .order_by(question_category.c.category_id)
        )
        cat_ids = [r[0] for r in cat_result.all()]
        out.append(
            QuestionOut(
                id=q.id, text=q.text, description=q.description, category_ids=cat_ids
            )
        )
    return out


@router.get("/people", response_model=PaginatedPeopleOut)
async def list_people(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    group_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Person)
    count_query = select(func.count()).select_from(Person)

    if group_id is not None:
        query = query.where(Person.group_id == group_id)
        count_query = count_query.where(Person.group_id == group_id)

    total = (await db.execute(count_query)).scalar()
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(Person.id).offset(offset).limit(page_size))
    people = result.scalars().all()

    return PaginatedPeopleOut(
        items=[PersonOut(id=p.id, name=p.name, group_id=p.group_id) for p in people],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/people/{person_id}", response_model=PersonDetailOut)
async def get_person(
    person_id: int,
    category: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    person = await db.get(Person, person_id)
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")

    group = await db.get(Group, person.group_id)

    # Answers
    answer_query = (
        select(Answer.question_id, Answer.value)
        .where(Answer.person_id == person_id)
        .order_by(Answer.question_id)
    )
    if category is not None:
        cat_qids = (
            await db.execute(
                select(question_category.c.question_id).where(
                    question_category.c.category_id == category
                )
            )
        )
        qids = [r[0] for r in cat_qids.all()]
        answer_query = answer_query.where(Answer.question_id.in_(qids))

    answer_result = await db.execute(answer_query)
    answers = [AnswerOut(question_id=r[0], value=r[1]) for r in answer_result.all()]

    # Person-person similarity
    sim_result = await db.execute(
        select(PersonPersonSim).where(
            (PersonPersonSim.person_a_id == person_id)
            | (PersonPersonSim.person_b_id == person_id)
        )
    )
    sim_rows = sim_result.scalars().all()

    cat_key = str(category) if category is not None else None
    person_sims = []
    for row in sim_rows:
        other_id = row.person_b_id if row.person_a_id == person_id else row.person_a_id
        sim = row.similarity
        if cat_key is not None and row.per_category and cat_key in row.per_category:
            sim = row.per_category[cat_key]
        person_sims.append((other_id, sim, row.confidence, row.shared_count))

    person_sims.sort(key=lambda x: x[1], reverse=True)
    similar = person_sims[:5]
    dissimilar = list(reversed(person_sims[-5:])) if len(person_sims) >= 5 else person_sims

    similar_people = await _build_similar_person_list(similar, db)
    dissimilar_people = await _build_similar_person_list(dissimilar, db)

    # Group comparisons
    group_result = await db.execute(
        select(PersonGroupSim)
        .where(PersonGroupSim.person_id == person_id)
        .order_by(PersonGroupSim.group_id)
    )
    pg_rows = group_result.scalars().all()

    group_comparisons = []
    for pg in pg_rows:
        g = await db.get(Group, pg.group_id)
        if cat_key is not None:
            gg_result = await db.execute(
                select(GroupGroupSim).where(
                    (
                        (GroupGroupSim.group_a_id == person.group_id)
                        & (GroupGroupSim.group_b_id == pg.group_id)
                    )
                    | (
                        (GroupGroupSim.group_a_id == pg.group_id)
                        & (GroupGroupSim.group_b_id == person.group_id)
                    )
                )
            )
            gg_row = gg_result.scalar_one_or_none()
            if gg_row and gg_row.per_category and cat_key in gg_row.per_category:
                sim = gg_row.per_category[cat_key]
            else:
                sim = pg.similarity
        else:
            sim = pg.similarity

        group_comparisons.append(
            GroupComparisonOut(
                group_id=pg.group_id,
                group_name=g.name if g else "Unknown",
                similarity=sim,
                confidence=pg.confidence,
                shared_count=pg.shared_count,
            )
        )

    group_comparisons.sort(key=lambda x: x.similarity, reverse=True)

    # Group member count
    member_count = (
        await db.execute(
            select(func.count()).select_from(Person).where(Person.group_id == group.id)
        )
    ).scalar()

    return PersonDetailOut(
        id=person.id,
        name=person.name,
        group=GroupSummaryOut(id=group.id, name=group.name, member_count=member_count),
        answers=answers,
        similar_people=similar_people,
        dissimilar_people=dissimilar_people,
        group_comparisons=group_comparisons,
    )


async def _build_similar_person_list(sims, db):
    result = []
    for other_id, sim, conf, sc in sims:
        other = await db.get(Person, other_id)
        if other:
            result.append(
                SimilarPersonOut(
                    id=other.id,
                    name=other.name,
                    similarity=sim,
                    confidence=conf,
                    shared_count=sc,
                )
            )
    return result


@router.get("/groups", response_model=list[GroupListOut])
async def list_groups(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Group).order_by(Group.id))
    groups = result.scalars().all()

    out = []
    for g in groups:
        member_count = (
            await db.execute(
                select(func.count()).select_from(Person).where(Person.group_id == g.id)
            )
        ).scalar()

        coh = await db.execute(
            select(GroupCohesivity.cohesivity).where(GroupCohesivity.group_id == g.id)
        )
        cohesivity = coh.scalar()

        out.append(
            GroupListOut(
                id=g.id, name=g.name, member_count=member_count, cohesivity=cohesivity
            )
        )
    return out


@router.get("/groups/{group_id}", response_model=GroupDetailOut)
async def get_group(
    group_id: int,
    category: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")

    member_count = (
        await db.execute(
            select(func.count()).select_from(Person).where(Person.group_id == group_id)
        )
    ).scalar()

    coh_result = await db.execute(
        select(GroupCohesivity).where(GroupCohesivity.group_id == group_id)
    )
    cohesivity_row = coh_result.scalar_one_or_none()

    cohesivity = cohesivity_row.cohesivity if cohesivity_row else 0.0
    per_category = cohesivity_row.per_category if cohesivity_row else None

    if category is not None and per_category:
        cat_key = str(category)
        cohesivity = per_category.get(cat_key, cohesivity)
        per_category = {cat_key: per_category.get(cat_key, 0.0)}

    # Similar groups
    gg_query = select(GroupGroupSim).where(
        (GroupGroupSim.group_a_id == group_id)
        | (GroupGroupSim.group_b_id == group_id)
    )
    gg_result = await db.execute(gg_query)
    gg_rows = gg_result.scalars().all()

    similar_groups = []
    for row in gg_rows:
        other_gid = row.group_b_id if row.group_a_id == group_id else row.group_a_id
        g = await db.get(Group, other_gid)

        if category is not None and row.per_category:
            cat_key = str(category)
            sim = row.per_category.get(cat_key, row.similarity)
            pc = {cat_key: row.per_category.get(cat_key, 0.0)}
        else:
            sim = row.similarity
            pc = row.per_category

        similar_groups.append(
            SimilarGroupOut(
                id=other_gid,
                name=g.name if g else "Unknown",
                similarity=sim,
                per_category=pc,
            )
        )

    similar_groups.sort(key=lambda x: x.similarity, reverse=True)

    return GroupDetailOut(
        id=group.id,
        name=group.name,
        member_count=member_count,
        cohesivity=cohesivity,
        per_category=per_category,
        similar_groups=similar_groups,
    )
