from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Answer,
    Category,
    CategoryDiscriminativeness,
    Commission,
    Group,
    GroupCohesivity,
    GroupEmbedding,
    GroupGroupSim,
    Voter,
    VoterEmbedding,
    VoterGroupSim,
    VoterVoterSim,
    Question,
    Role,
    question_category,
)
from app.schemas import (
    AnswerOut,
    BarycenterOut,
    CategoryAlignmentOut,
    CategoryDiscriminativenessOut,
    CategoryOut,
    DeterminantCategoryOut,
    EmbeddingPointOut,
    GroupAnswerStatsOut,
    GroupComparisonOut,
    GroupDetailOut,
    GroupListOut,
    GroupsEmbeddingOut,
    GroupSummaryOut,
    PaginatedVotersOut,
    VotersEmbeddingOut,
    VoterDetailOut,
    VoterOut,
    QuestionDetailOut,
    QuestionOut,
    SimilarGroupOut,
    SimilarVoterOut,
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
            has_passed=q.has_passed,
            category_ids=qid_to_cats.get(q.id, []),
        )
        for q in questions
    ]


@router.get("/questions/{question_id}", response_model=QuestionDetailOut)
async def get_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
):
    question = await db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    qc_result = await db.execute(
        select(question_category.c.category_id).where(
            question_category.c.question_id == question_id
        )
    )
    cat_ids = [r[0] for r in qc_result.all()]

    cat_result = await db.execute(select(Category).where(Category.id.in_(cat_ids)))
    cat_names = [c.name for c in cat_result.scalars().all()]

    total_yes = (
        await db.execute(
            select(func.count())
            .select_from(Answer)
            .where(Answer.question_id == question_id, Answer.value)
        )
    ).scalar() or 0
    total_no = (
        await db.execute(
            select(func.count())
            .select_from(Answer)
            .where(Answer.question_id == question_id, ~Answer.value)
        )
    ).scalar() or 0

    total_voters = (
        await db.execute(select(func.count()).select_from(Voter))
    ).scalar() or 0
    total_missing = total_voters - total_yes - total_no

    all_groups = (
        await db.execute(select(Group).order_by(Group.id))
    ).scalars().all()

    group_stats = []
    for g in all_groups:
        member_ids_result = await db.execute(
            select(Voter.id).where(Voter.group_id == g.id)
        )
        member_ids = [r[0] for r in member_ids_result.all()]
        n_members = len(member_ids)

        g_yes = 0
        g_no = 0
        if member_ids:
            g_yes = (
                await db.execute(
                    select(func.count())
                    .select_from(Answer)
                    .where(
                        Answer.question_id == question_id,
                        Answer.value,
                        Answer.voter_id.in_(member_ids),
                    )
                )
            ).scalar() or 0
            g_no = (
                await db.execute(
                    select(func.count())
                    .select_from(Answer)
                    .where(
                        Answer.question_id == question_id,
                        ~Answer.value,
                        Answer.voter_id.in_(member_ids),
                    )
                )
            ).scalar() or 0

        g_missing = n_members - g_yes - g_no
        yes_rate = g_yes / (g_yes + g_no) if (g_yes + g_no) > 0 else 0.0

        group_stats.append(
            GroupAnswerStatsOut(
                group_id=g.id,
                group_name=g.name,
                group_color=g.color,
                yes_count=g_yes,
                no_count=g_no,
                missing_count=g_missing,
                yes_rate=yes_rate,
            )
        )

    return QuestionDetailOut(
        id=question.id,
        text=question.text,
        description=question.description,
        has_passed=question.has_passed,
        category_ids=cat_ids,
        category_names=cat_names,
        total_yes=total_yes,
        total_no=total_no,
        total_missing=total_missing,
        group_stats=group_stats,
    )


@router.get("/voters", response_model=PaginatedVotersOut)
async def list_voters(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=2000),
    group_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Voter)
    count_query = select(func.count()).select_from(Voter)

    if group_id is not None:
        query = query.where(Voter.group_id == group_id)
        count_query = count_query.where(Voter.group_id == group_id)

    total = (await db.execute(count_query)).scalar()
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(Voter.id).offset(offset).limit(page_size))
    voters = result.scalars().all()

    group_ids = {p.group_id for p in voters}
    role_ids = {p.role_id for p in voters if p.role_id}
    comm_ids = {p.commission_id for p in voters if p.commission_id}

    g_result = await db.execute(
        select(Group.id, Group.name, Group.color).where(Group.id.in_(group_ids))
    )
    group_map = {r[0]: (r[1], r[2]) for r in g_result.all()}

    role_map = {}
    if role_ids:
        r_result = await db.execute(select(Role.id, Role.name).where(Role.id.in_(role_ids)))
        role_map = dict(r_result.all())

    comm_map = {}
    if comm_ids:
        c_result = await db.execute(
            select(Commission.id, Commission.name).where(Commission.id.in_(comm_ids))
        )
        comm_map = dict(c_result.all())

    return PaginatedVotersOut(
        items=[
            VoterOut(
                id=p.id,
                firstname=p.firstname,
                lastname=p.lastname,
                group_id=p.group_id,
                group_name=group_map.get(p.group_id, ("Unknown", "#808080"))[0],
                group_color=group_map.get(p.group_id, ("Unknown", "#808080"))[1],
                role=role_map.get(p.role_id) if p.role_id else None,
                commission=comm_map.get(p.commission_id) if p.commission_id else None,
                circonscription=p.circonscription,
            )
            for p in voters
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/voters/{voter_id}", response_model=VoterDetailOut)
async def get_voter(
    voter_id: int,
    category: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    voter = await db.get(Voter, voter_id)
    if voter is None:
        raise HTTPException(status_code=404, detail="Voter not found")

    group = await db.get(Group, voter.group_id)

    # Answers
    all_qid_query = select(Question.id).order_by(Question.id)
    if category is not None:
        cat_qids = (
            await db.execute(
                select(question_category.c.question_id).where(
                    question_category.c.category_id == category
                )
            )
        )
        qids_in_cat = [r[0] for r in cat_qids.all()]
        all_qid_query = select(Question.id).where(
            Question.id.in_(qids_in_cat)
        ).order_by(Question.id)

    all_qid_result = await db.execute(all_qid_query)
    all_qids = [r[0] for r in all_qid_result.all()]

    answer_query = (
        select(Answer.question_id, Answer.value)
        .where(Answer.voter_id == voter_id)
        .order_by(Answer.question_id)
    )
    if category is not None:
        answer_query = answer_query.where(Answer.question_id.in_(qids_in_cat))

    answer_result = await db.execute(answer_query)
    answer_rows = answer_result.all()
    answer_map = {r[0]: r[1] for r in answer_rows}

    q_text_map = {}
    q_passed_map = {}
    if all_qids:
        q_result = await db.execute(
            select(Question.id, Question.text, Question.has_passed).where(
                Question.id.in_(all_qids)
            )
        )
        for qid, qtext, qpassed in q_result.all():
            q_text_map[qid] = qtext
            q_passed_map[qid] = qpassed

    answers = [
        AnswerOut(
            question_id=qid,
            value=answer_map.get(qid, False),
            answered=qid in answer_map,
            question_text=q_text_map.get(qid),
            has_passed=q_passed_map.get(qid),
        )
        for qid in all_qids
    ]

    # Voter-voter similarity
    sim_result = await db.execute(
        select(VoterVoterSim).where(
            (VoterVoterSim.voter_a_id == voter_id)
            | (VoterVoterSim.voter_b_id == voter_id)
        )
    )
    sim_rows = sim_result.scalars().all()

    cat_key = str(category) if category is not None else None
    voter_sims = []
    other_ids = set()
    for row in sim_rows:
        other_id = row.voter_b_id if row.voter_a_id == voter_id else row.voter_a_id
        sim = row.similarity
        if cat_key is not None and row.per_category and cat_key in row.per_category:
            sim = row.per_category[cat_key]
        voter_sims.append((other_id, sim, row.confidence, row.shared_count))
        other_ids.add(other_id)

    voter_sims.sort(key=lambda x: x[1], reverse=True)
    similar = voter_sims[:5]
    dissimilar = list(reversed(voter_sims[-5:])) if len(voter_sims) >= 5 else voter_sims

    # Batch fetch voter names
    all_sim_ids = {s[0] for s in similar + dissimilar}
    voter_map = {}
    if all_sim_ids:
        p_result = await db.execute(
            select(Voter.id, Voter.firstname, Voter.lastname).where(
                Voter.id.in_(all_sim_ids)
            )
        )
        voter_map = {r[0]: (r[1], r[2]) for r in p_result.all()}

    similar_voters = [
        SimilarVoterOut(
            id=oid,
            firstname=voter_map[oid][0],
            lastname=voter_map[oid][1],
            similarity=sim,
            confidence=conf,
            shared_count=sc,
        )
        for oid, sim, conf, sc in similar
        if oid in voter_map
    ]
    dissimilar_voters = [
        SimilarVoterOut(
            id=oid,
            firstname=voter_map[oid][0],
            lastname=voter_map[oid][1],
            similarity=sim,
            confidence=conf,
            shared_count=sc,
        )
        for oid, sim, conf, sc in dissimilar
        if oid in voter_map
    ]

    # Group comparisons
    group_result = await db.execute(
        select(VoterGroupSim)
        .where(VoterGroupSim.voter_id == voter_id)
        .order_by(VoterGroupSim.group_id)
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
            select(func.count()).select_from(Voter).where(Voter.group_id == group.id)
        )
    ).scalar()

    role_name = None
    if voter.role_id:
        role = await db.get(Role, voter.role_id)
        if role:
            role_name = role.name

    commission_name = None
    if voter.commission_id:
        comm = await db.get(Commission, voter.commission_id)
        if comm:
            commission_name = comm.name

    group_yes_rates = {}
    own_member_ids_result = await db.execute(
        select(Voter.id).where(Voter.group_id == group.id)
    )
    own_member_ids = [r[0] for r in own_member_ids_result.all()]

    answer_rate = len(answer_map) / len(all_qids) if all_qids else 0.0

    group_avg_answer_rate = 0.0
    if own_member_ids and all_qids:
        member_answer_counts = (
            await db.execute(
                select(Answer.voter_id, func.count())
                .where(Answer.voter_id.in_(own_member_ids))
                .group_by(Answer.voter_id)
            )
        ).all()
        rates = [cnt / len(all_qids) for _, cnt in member_answer_counts]
        unanswered_members = len(own_member_ids) - len(rates)
        if unanswered_members > 0:
            rates.extend([0.0] * unanswered_members)
        group_avg_answer_rate = sum(rates) / len(rates) if rates else 0.0

    if own_member_ids and all_qids:
        for qid in all_qids:
            yes_count = (
                await db.execute(
                    select(func.count())
                    .select_from(Answer)
                    .where(
                        Answer.question_id == qid,
                        Answer.value,
                        Answer.voter_id.in_(own_member_ids),
                    )
                )
            ).scalar() or 0
            total_count = (
                await db.execute(
                    select(func.count())
                    .select_from(Answer)
                    .where(
                        Answer.question_id == qid,
                        Answer.voter_id.in_(own_member_ids),
                    )
                )
            ).scalar() or 0
            group_yes_rates[str(qid)] = (
                yes_count / total_count if total_count > 0 else 0.0
            )

    return VoterDetailOut(
        id=voter.id,
        firstname=voter.firstname,
        lastname=voter.lastname,
        group=GroupSummaryOut(
            id=group.id, name=group.name, color=group.color, member_count=member_count
        ),
        role=role_name,
        commission=commission_name,
        circonscription=voter.circonscription,
        answers=answers,
        group_yes_rates=group_yes_rates if group_yes_rates else None,
        answer_rate=answer_rate,
        group_avg_answer_rate=group_avg_answer_rate,
        similar_voters=similar_voters,
        dissimilar_voters=dissimilar_voters,
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
            select(Voter.group_id, func.count())
            .where(Voter.group_id.in_(group_ids))
            .group_by(Voter.group_id)
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
            select(func.count()).select_from(Voter).where(Voter.group_id == group_id)
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

    if category is not None:
        cat_qids = (
            await db.execute(
                select(question_category.c.question_id).where(
                    question_category.c.category_id == category
                )
            )
        )
        qids_in_cat = [r[0] for r in cat_qids.all()]

    total_questions_query = select(func.count()).select_from(Question)
    if category is not None:
        total_questions_query = total_questions_query.where(Question.id.in_(qids_in_cat))
    total_questions = (await db.execute(total_questions_query)).scalar() or 1

    group_answer_rate = 0.0
    if member_count and member_count > 0:
        member_ids_result = await db.execute(
            select(Voter.id).where(Voter.group_id == group_id)
        )
        member_ids = [r[0] for r in member_ids_result.all()]
        if member_ids:
            answer_query = (
                select(Answer.voter_id, func.count())
                .where(Answer.voter_id.in_(member_ids))
            )
            if category is not None:
                answer_query = answer_query.where(Answer.question_id.in_(qids_in_cat))
            member_answer_counts = (
                await db.execute(answer_query.group_by(Answer.voter_id))
            ).all()
            rates = [cnt / total_questions for _, cnt in member_answer_counts]
            unanswered_members = len(member_ids) - len(rates)
            if unanswered_members > 0:
                rates.extend([0.0] * unanswered_members)
            group_answer_rate = sum(rates) / len(rates) if rates else 0.0

    return GroupDetailOut(
        id=group.id,
        name=group.name,
        color=group.color,
        member_count=member_count,
        cohesivity=cohesivity,
        answer_rate=group_answer_rate,
        per_category=per_category,
        similar_groups=similar_groups,
    )


@router.get("/embeddings/voters", response_model=VotersEmbeddingOut)
async def get_voters_embeddings(
    category: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    emb_query = select(VoterEmbedding).where(VoterEmbedding.category_id == category)
    emb_result = await db.execute(emb_query.order_by(VoterEmbedding.voter_id))
    emb_rows = emb_result.scalars().all()

    if not emb_rows:
        raise HTTPException(status_code=404, detail="No embeddings found for this category")

    voter_ids = [e.voter_id for e in emb_rows]

    p_result = await db.execute(
        select(Voter.id, Voter.firstname, Voter.lastname, Voter.group_id).where(
            Voter.id.in_(voter_ids)
        )
    )
    voter_map = {r[0]: (r[1], r[2], r[3]) for r in p_result.all()}

    group_ids = {v[2] for v in voter_map.values()}
    g_result = await db.execute(
        select(Group.id, Group.name, Group.color).where(Group.id.in_(group_ids))
    )
    group_map = {r[0]: (r[1], r[2]) for r in g_result.all()}

    points = []
    bary_sum: dict[int, list[float]] = {}
    bary_count: dict[int, int] = {}

    for e in emb_rows:
        fname, lname, gid = voter_map.get(
            e.voter_id, ("Unknown", "", None)
        )
        pname = f"{fname} {lname}".strip()
        if gid:
            gname, gcolor = group_map.get(gid, ("Unknown", "#808080"))
        else:
            gname, gcolor = "Unknown", "#808080"

        points.append(
            EmbeddingPointOut(
                id=e.voter_id,
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
            select(func.count()).select_from(Voter).where(Voter.group_id == gid)
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

    return VotersEmbeddingOut(
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


@router.get("/categories/discriminativeness", response_model=list[CategoryDiscriminativenessOut])
async def get_category_discriminativeness(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CategoryDiscriminativeness).order_by(
            CategoryDiscriminativeness.normalized_ig.desc()
        )
    )
    cd_rows = result.scalars().all()

    cat_ids = [cd.category_id for cd in cd_rows]
    cat_result = await db.execute(select(Category).where(Category.id.in_(cat_ids)))
    cat_map = {c.id: c.name for c in cat_result.scalars().all()}

    out = []
    for cd in cd_rows:
        breakdown = None
        if cd.per_group_breakdown:
            breakdown = {
                gid: {
                    "accuracy": v["accuracy"],
                    "most_confused_with": v.get("most_confused_with"),
                    "most_confused_similarity": v.get("most_confused_similarity"),
                    "kl_divergence": v["kl_divergence"],
                }
                for gid, v in cd.per_group_breakdown.items()
            }
        out.append(
            CategoryDiscriminativenessOut(
                category_id=cd.category_id,
                category_name=cat_map.get(cd.category_id, "Unknown"),
                info_gain=cd.info_gain,
                normalized_ig=cd.normalized_ig,
                variance_score=cd.variance_score,
                per_group_breakdown=breakdown,
            )
        )
    return out


@router.get(
    "/groups/{group_id}/determinant-categories",
    response_model=list[DeterminantCategoryOut],
)
async def get_group_determinant_categories(
    group_id: int,
    db: AsyncSession = Depends(get_db),
):
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")

    result = await db.execute(
        select(CategoryDiscriminativeness).order_by(
            CategoryDiscriminativeness.normalized_ig.desc()
        )
    )
    cd_rows = result.scalars().all()

    cat_ids = [cd.category_id for cd in cd_rows]
    cat_result = await db.execute(select(Category).where(Category.id.in_(cat_ids)))
    cat_map = {c.id: c.name for c in cat_result.scalars().all()}

    group_map = {}
    g_result = await db.execute(select(Group.id, Group.name))
    group_map = dict(g_result.all())

    out = []
    for cd in cd_rows:
        breakdown = cd.per_group_breakdown or {}
        group_data = breakdown.get(str(group_id), {})
        accuracy = group_data.get("accuracy", 0.0)
        most_confused_id = group_data.get("most_confused_with")
        most_confused_sim = group_data.get("most_confused_similarity")
        kl = group_data.get("kl_divergence", 0.0)

        out.append(
            DeterminantCategoryOut(
                category_id=cd.category_id,
                category_name=cat_map.get(cd.category_id, "Unknown"),
                info_gain=cd.info_gain,
                normalized_ig=cd.normalized_ig,
                accuracy=accuracy,
                most_confused_with_id=most_confused_id,
                most_confused_with_name=(
                    group_map.get(most_confused_id) if most_confused_id else None
                ),
                most_confused_similarity=most_confused_sim,
                kl_divergence=kl,
            )
        )
    return out


@router.get("/voters/{voter_id}/category-alignment", response_model=list[CategoryAlignmentOut])
async def get_voter_category_alignment(
    voter_id: int,
    db: AsyncSession = Depends(get_db),
):
    voter = await db.get(Voter, voter_id)
    if voter is None:
        raise HTTPException(status_code=404, detail="Voter not found")

    pg_result = await db.execute(
        select(VoterGroupSim).where(VoterGroupSim.voter_id == voter_id)
    )
    pg_rows = pg_result.scalars().all()

    own_group_id = voter.group_id

    cat_result = await db.execute(select(Category).order_by(Category.id))
    cat_map = {c.id: c.name for c in cat_result.scalars().all()}

    out = []
    all_cat_ids = sorted(cat_map.keys())
    for cat_id in all_cat_ids:
        cat_key = str(cat_id)
        own_sim = None
        other_sims = []

        for pg in pg_rows:
            sim = None
            if pg.per_category and cat_key in pg.per_category:
                sim = pg.per_category[cat_key]
            elif pg.per_category is None:
                continue
            else:
                continue

            if pg.group_id == own_group_id:
                own_sim = sim
            else:
                other_sims.append(sim)

        if own_sim is not None and other_sims:
            avg_other = sum(other_sims) / len(other_sims)
            alignment = own_sim - avg_other
            out.append(
                CategoryAlignmentOut(
                    category_id=cat_id,
                    category_name=cat_map[cat_id],
                    own_group_similarity=own_sim,
                    avg_other_group_similarity=avg_other,
                    alignment=alignment,
                )
            )

    return out
