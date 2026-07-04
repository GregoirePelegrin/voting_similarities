import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import settings
from app.models import (
    Answer,
    Base,
    Category,
    Commission,
    Group,
    Role,
    Voter,
    Vote,
)
from datetime import UTC, datetime
from sqlalchemy import text, select, func, insert
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

BATCH_SIZE = 50_000
PARLIAMENT_DB_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/parliament"
INSERT_SQL = text("""INSERT INTO answers (voter_id, vote_id, value, answered, present)
                     VALUES (:voter_id, :vote_id, :value, :answered, :present)""")

GROUP_COLORS = [
    "#4E79A7", "#F28E2B", "#E15759", "#76B7B2",
    "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7",
    "#9C755F", "#BAB0AC", "#86BCB6", "#8CD17D",
]

CATEGORY_NORMALIZE = {
    "Education & Recherche": "Éducation & Recherche",
}

ROLE_NORMALIZE = {
    "Apparentée": "Apparenté",
    "Présidente": "Président",
}


def normalize_cat(name: str) -> str:
    name = name.strip()
    return CATEGORY_NORMALIZE.get(name, name)


def normalize_role(name: str | None) -> str | None:
    if not name or not name.strip():
        return None
    return ROLE_NORMALIZE.get(name.strip(), name.strip())


async def ingest():
    parl_engine = create_async_engine(PARLIAMENT_DB_URL, echo=False)
    target_engine = create_async_engine(settings.DATABASE_URL, echo=False)

    print("Dropping and recreating tables...")
    async with target_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(target_engine, expire_on_commit=False)

    async with session_factory() as session:
        # --- Read parliament members ---
        print("Reading members from parliament...")
        async with async_sessionmaker(parl_engine, expire_on_commit=False)() as parl_session:
            members = (await parl_session.execute(
                text("SELECT id, first_name, last_name, group_name, role, commission, circonscription FROM members ORDER BY id")
            )).fetchall()

        # --- Groups ---
        print("Inserting groups...")
        group_names = sorted({m[3].strip() for m in members if m[3] and m[3].strip()})
        if not group_names:
            group_names = ["Non inscrits"]
        groups = [
            Group(name=name, color=GROUP_COLORS[i] if i < len(GROUP_COLORS) else "#999999")
            for i, name in enumerate(group_names)
        ]
        session.add_all(groups)
        await session.flush()
        group_map = {g.name: g.id for g in groups}

        # --- Roles ---
        print("Inserting roles...")
        role_names = sorted({
            normalize_role(m[4]) for m in members
            if normalize_role(m[4]) is not None
        })
        roles = [Role(name=name) for name in role_names]
        session.add_all(roles)
        await session.flush()
        role_map = {r.name: r.id for r in roles}

        # --- Commissions ---
        print("Inserting commissions...")
        commission_names = sorted({m[5].strip() for m in members if m[5] and m[5].strip()})
        commissions = [Commission(name=name) for name in commission_names]
        session.add_all(commissions)
        await session.flush()
        commission_map = {c.name: c.id for c in commissions}

        # --- Voters ---
        print("Inserting voters...")
        voters = []
        for m in members:
            group_name = m[3].strip() if m[3] and m[3].strip() else "Non inscrits"
            role_name = normalize_role(m[4])
            commission_name = m[5].strip() if m[5] and m[5].strip() else commission_names[0]
            v = Voter(
                firstname=m[1],
                lastname=m[2],
                group_id=group_map[group_name],
                role_id=role_map.get(role_name) if role_name else None,
                commission_id=commission_map[commission_name],
                circonscription=m[6].strip() if m[6] else None,
            )
            voters.append(v)
        session.add_all(voters)
        await session.flush()
        member_to_voter = {
            members[i][0]: voters[i].id
            for i in range(len(members))
        }

        # --- Read parliament votes ---
        print("Reading votes from parliament...")
        async with async_sessionmaker(parl_engine, expire_on_commit=False)() as parl_session:
            votes_data = (await parl_session.execute(
                text("SELECT id, title, categories FROM votes ORDER BY id")
            )).fetchall()

        # --- Categories ---
        print("Normalizing categories...")
        all_cat_names = []
        for v in votes_data:
            cats = v[2] or []
            for c in cats:
                normalized = normalize_cat(c)
                if normalized:
                    all_cat_names.append(normalized)
        unique_cats = sorted(set(all_cat_names))
        categories = [Category(name=name) for name in unique_cats]
        session.add_all(categories)
        await session.flush()
        cat_map = {c.name: c for c in categories}

        # --- Votes ---
        print("Inserting votes...")
        vote_objects = []
        for v_data in votes_data:
            title = v_data[1]
            cats = v_data[2] or []
            cat_objs = [cat_map[normalize_cat(c)] for c in cats if normalize_cat(c) in cat_map]
            vote_obj = Vote(text=title)
            vote_obj.categories = cat_objs
            vote_objects.append(vote_obj)
        session.add_all(vote_objects)
        await session.flush()
        parliament_to_vote = {
            votes_data[i][0]: vote_objects[i].id
            for i in range(len(votes_data))
        }

        # --- Answers ---
        print("Inserting answers from bulletins (streaming)...")
        total_absent = 0
        total_abstention = 0
        total_voted = 0
        total_answers = 0
        batch = []

        async with async_sessionmaker(parl_engine, expire_on_commit=False)() as parl_session:
            bulletins = (await parl_session.execute(
                text("SELECT vote_id, member_id, vote FROM bulletins ORDER BY vote_id, member_id")
            )).fetchall()

        for b in bulletins:
            parliament_vote_id = b[0]
            parliament_member_id = b[1]
            vote_type = b[2]

            target_vote_id = parliament_to_vote.get(parliament_vote_id)
            target_voter_id = member_to_voter.get(parliament_member_id)
            if target_vote_id is None or target_voter_id is None:
                continue

            if vote_type == "Non votant":
                total_absent += 1
                continue

            answered = vote_type in ("Pour", "Contre")
            value = vote_type == "Pour"

            batch.append({
                "vote_id": target_vote_id,
                "voter_id": target_voter_id,
                "value": value,
                "answered": answered,
                "present": True,
            })
            total_answers += 1
            if answered:
                total_voted += 1
            else:
                total_abstention += 1

            if len(batch) >= BATCH_SIZE:
                await session.execute(INSERT_SQL, batch)
                batch.clear()
                await session.flush()
                print(f"  Inserted {total_answers} answers...")

        if batch:
            await session.execute(INSERT_SQL, batch)
            batch.clear()
            await session.flush()
        print(f"  Done: {total_answers} answers (voted={total_voted}, abstention={total_abstention}, absent={total_absent})")

        # --- Compute has_passed ---
        print("Computing has_passed...")
        rows = (await session.execute(
            select(
                Vote.id,
                func.count().filter(Answer.answered, Answer.value).label("yes"),
                func.count().filter(Answer.answered, ~Answer.value).label("no"),
            )
            .outerjoin(Answer, Answer.vote_id == Vote.id)
            .group_by(Vote.id)
        )).fetchall()
        for row in rows:
            vote_id = row[0]
            yes = row[1] or 0
            no = row[2] or 0
            vote = await session.get(Vote, vote_id)
            vote.has_passed = yes > no

        await session.commit()

    # --- Summary ---
    async with session_factory() as session:
        n_groups = (await session.execute(select(func.count()).select_from(Group))).scalar()
        n_voters = (await session.execute(select(func.count()).select_from(Voter))).scalar()
        n_votes = (await session.execute(select(func.count()).select_from(Vote))).scalar()
        n_cats = (await session.execute(select(func.count()).select_from(Category))).scalar()
        n_answers = (await session.execute(select(func.count()).select_from(Answer))).scalar()

    print("\nIngestion complete!")
    print(f"  Groups:     {n_groups}")
    print(f"  Voters:     {n_voters}")
    print(f"  Votes:      {n_votes}")
    print(f"  Categories: {n_cats}")
    print(f"  Answers:    {n_answers}")
    print(f"  Absent:     {total_absent}")
    print(f"  Abstention: {total_abstention}")
    print(f"  Voted:      {total_voted}")

    await parl_engine.dispose()
    await target_engine.dispose()


if __name__ == "__main__":
    asyncio.run(ingest())
