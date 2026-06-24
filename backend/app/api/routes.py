from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Answer,
    Category,
    Group,
    GroupCohesivity,
    GroupEmbedding,
    GroupGroupSim,
    Person,
    PersonEmbedding,
    PersonGroupSim,
    PersonPersonSim,
    Question,
    question_category,
)
from app.schemas import (
    AnswerOut,
    BarycenterOut,
    CategoryOut,
    EmbeddingPointOut,
    GroupComparisonOut,
    GroupDetailOut,
    GroupListOut,
    GroupsEmbeddingOut,
    GroupSummaryOut,
    PaginatedPeopleOut,
    PeopleEmbeddingOut,
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

    qc_result = await db.execute(
        select(
            question_category.c.question_id,
            question_category.c.category_id,
        ).order_by(question_category.c.question_id, question_category.c.category_id)
    )
    qid_to_cats: dict[int, list[int]] = {}
    for qid, cid in qc_result.all():
        qid_to_cats.setdefault(qid, []).append(cid)

    return [
        QuestionOut(
            id=q.id,
            text=q.text,
            description=q.description,
            category_ids=qid_to_cats.get(q.id, []),
        )
        for q in questions
    ]


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
    other_ids = set()
    for row in sim_rows:
        other_id = row.person_b_id if row.person_a_id == person_id else row.person_a_id
        sim = row.similarity
        if cat_key is not None and row.per_category and cat_key in row.per_category:
            sim = row.per_category[cat_key]
        person_sims.append((other_id, sim, row.confidence, row.shared_count))
        other_ids.add(other_id)

    person_sims.sort(key=lambda x: x[1], reverse=True)
    similar = person_sims[:5]
    dissimilar = list(reversed(person_sims[-5:])) if len(person_sims) >= 5 else person_sims

    # Batch fetch person names
    all_sim_ids = {s[0] for s in similar + dissimilar}
    person_map = {}
    if all_sim_ids:
        p_result = await db.execute(
            select(Person.id, Person.name).where(Person.id.in_(all_sim_ids))
        )
        person_map = dict(p_result.all())

    similar_people = [
        SimilarPersonOut(
            id=oid, name=person_map[oid], similarity=sim, confidence=conf, shared_count=sc
        )
        for oid, sim, conf, sc in similar
        if oid in person_map
    ]
    dissimilar_people = [
        SimilarPersonOut(
            id=oid, name=person_map[oid], similarity=sim, confidence=conf, shared_count=sc
        )
        for oid, sim, conf, sc in dissimilar
        if oid in person_map
    ]

    # Group comparisons
    group_result = await db.execute(
        select(PersonGroupSim)
        .where(PersonGroupSim.person_id == person_id)
        .order_by(PersonGroupSim.group_id)
    )
    pg_rows = group_result.scalars().all()

    # Batch fetch group names and colors
    pg_group_ids = {pg.group_id for pg in pg_rows}
    group_map = {}
    group_color_map = {}
    if pg_group_ids:
        g_result = await db.execute(
            select(Group.id, Group.name, Group.color).where(Group.id.in_(pg_group_ids))
        )
        for gid, gname, gcolor in g_result.all():
            group_map[gid] = gname
            group_color_map[gid] = gcolor

    group_comparisons = []
    for pg in pg_rows:
        sim = pg.similarity
        if cat_key is not None and pg.per_category and cat_key in pg.per_category:
            sim = pg.per_category[cat_key]

        group_comparisons.append(
            GroupComparisonOut(
                group_id=pg.group_id,
                group_name=group_map.get(pg.group_id, "Unknown"),
                group_color=group_color_map.get(pg.group_id, "#808080"),
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
        group=GroupSummaryOut(
            id=group.id, name=group.name, color=group.color, member_count=member_count
        ),
        answers=answers,
        similar_people=similar_people,
        dissimilar_people=dissimilar_people,
        group_comparisons=group_comparisons,
    )


@router.get("/groups", response_model=list[GroupListOut])
async def list_groups(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Group).order_by(Group.id))
    groups = result.scalars().all()
    group_ids = [g.id for g in groups]

    member_counts = {}
    if group_ids:
        mc_result = await db.execute(
            select(Person.group_id, func.count())
            .where(Person.group_id.in_(group_ids))
            .group_by(Person.group_id)
        )
        member_counts = dict(mc_result.all())

    coh_map = {}
    if group_ids:
        coh_result = await db.execute(
            select(GroupCohesivity.group_id, GroupCohesivity.cohesivity).where(
                GroupCohesivity.group_id.in_(group_ids)
            )
        )
        coh_map = dict(coh_result.all())

    return [
        GroupListOut(
            id=g.id,
            name=g.name,
            color=g.color,
            member_count=member_counts.get(g.id, 0),
            cohesivity=coh_map.get(g.id),
        )
        for g in groups
    ]


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
    gg_result = await db.execute(
        select(GroupGroupSim).where(
            (GroupGroupSim.group_a_id == group_id)
            | (GroupGroupSim.group_b_id == group_id)
        )
    )
    gg_rows = gg_result.scalars().all()

    # Batch fetch group names for similar groups
    other_gids = set()
    for row in gg_rows:
        other_gids.add(
            row.group_b_id if row.group_a_id == group_id else row.group_a_id
        )
    group_map = {}
    if other_gids:
        g_result = await db.execute(
            select(Group.id, Group.name, Group.color).where(Group.id.in_(other_gids))
        )
        group_map = {}
        group_color_map = {}
        for gid, gname, gcolor in g_result.all():
            group_map[gid] = gname
            group_color_map[gid] = gcolor

    similar_groups = []
    for row in gg_rows:
        other_gid = row.group_b_id if row.group_a_id == group_id else row.group_a_id

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
                name=group_map.get(other_gid, "Unknown"),
                color=group_color_map.get(other_gid, "#808080"),
                similarity=sim,
                per_category=pc,
            )
        )

    similar_groups.sort(key=lambda x: x.similarity, reverse=True)

    return GroupDetailOut(
        id=group.id,
        name=group.name,
        color=group.color,
        member_count=member_count,
        cohesivity=cohesivity,
        per_category=per_category,
        similar_groups=similar_groups,
    )


@router.get("/embeddings/people", response_model=PeopleEmbeddingOut)
async def get_people_embeddings(
    category: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    emb_query = select(PersonEmbedding).where(PersonEmbedding.category_id == category)
    emb_result = await db.execute(emb_query.order_by(PersonEmbedding.person_id))
    emb_rows = emb_result.scalars().all()

    if not emb_rows:
        raise HTTPException(status_code=404, detail="No embeddings found for this category")

    person_ids = [e.person_id for e in emb_rows]

    p_result = await db.execute(
        select(Person.id, Person.name, Person.group_id).where(Person.id.in_(person_ids))
    )
    person_map = {r[0]: (r[1], r[2]) for r in p_result.all()}

    group_ids = {v[1] for v in person_map.values()}
    g_result = await db.execute(
        select(Group.id, Group.name, Group.color).where(Group.id.in_(group_ids))
    )
    group_map = {r[0]: (r[1], r[2]) for r in g_result.all()}

    points = []
    bary_sum: dict[int, list[float]] = {}
    bary_count: dict[int, int] = {}

    for e in emb_rows:
        pname, gid = person_map.get(e.person_id, ("Unknown", None))
        if gid:
            gname, gcolor = group_map.get(gid, ("Unknown", "#808080"))
        else:
            gname, gcolor = "Unknown", "#808080"

        points.append(
            EmbeddingPointOut(
                id=e.person_id,
                name=pname,
                group_id=gid,
                group_name=gname,
                group_color=gcolor,
                color=gcolor,
                x=e.x,
                y=e.y,
            )
        )

        if gid is not None:
            bary_sum.setdefault(gid, [0.0, 0.0])
            bary_sum[gid][0] += e.x
            bary_sum[gid][1] += e.y
            bary_count[gid] = bary_count.get(gid, 0) + 1

    barycenters = []
    for gid, (sx, sy) in bary_sum.items():
        n = bary_count[gid]
        gname, gcolor = group_map.get(gid, ("Unknown", "#808080"))
        mc_result = await db.execute(
            select(func.count()).select_from(Person).where(Person.group_id == gid)
        )
        mc = mc_result.scalar() or 0
        barycenters.append(
            BarycenterOut(
                group_id=gid,
                name=gname,
                color=gcolor,
                member_count=mc,
                x=sx / n,
                y=sy / n,
            )
        )

    stress = emb_rows[0].stress if emb_rows else 0.0

    return PeopleEmbeddingOut(
        stress=stress,
        category_id=category,
        points=points,
        barycenters=barycenters,
    )


@router.get("/embeddings/groups", response_model=GroupsEmbeddingOut)
async def get_groups_embeddings(
    category: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    emb_query = select(GroupEmbedding).where(GroupEmbedding.category_id == category)
    emb_result = await db.execute(emb_query.order_by(GroupEmbedding.group_id))
    emb_rows = emb_result.scalars().all()

    if not emb_rows:
        raise HTTPException(status_code=404, detail="No embeddings found for this category")

    group_ids = [e.group_id for e in emb_rows]

    g_result = await db.execute(
        select(Group.id, Group.name, Group.color).where(Group.id.in_(group_ids))
    )
    group_map = {r[0]: (r[1], r[2]) for r in g_result.all()}

    points = []
    for e in emb_rows:
        gname, gcolor = group_map.get(e.group_id, ("Unknown", "#808080"))
        points.append(
            EmbeddingPointOut(
                id=e.group_id,
                name=gname,
                color=gcolor,
                x=e.x,
                y=e.y,
            )
        )

    stress = emb_rows[0].stress if emb_rows else 0.0

    return GroupsEmbeddingOut(
        stress=stress,
        category_id=category,
        points=points,
    )
