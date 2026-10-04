import argparse
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
    Vote,
    Voter,
)
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

BATCH_SIZE = 50_000
PARLIAMENT_DB_URL = os.environ.get(
    "PARLIAMENT_DB_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/parliament",
)
INSERT_SQL = text("""INSERT INTO answers (voter_id, vote_id, value, answered, present)
                     VALUES (:voter_id, :vote_id, :value, :answered, :present)""")

GROUPS: dict[str, tuple[str | None, str]] = {
    "Rassemblement National": ("RN", "#9c755f"),
    "Ensemble pour la République": ("Ens", "#edc948"),
    "La France insoumise - Nouveau Front Populaire": ("LFI", "#7b13d6"),
    "Socialistes et apparentés": ("Soc", "#ff8080"),
    "Droite Républicaine": ("Rep", "#0066cc"),
    "Les Démocrates": ("Dem", "#ff751f"),
    "Écologiste et Social": ("Eco", "#4bb166"),
    "Horizons & Indépendants": ("Hor", "#27348a"),
    "Députés non inscrits": ("NI", "#999999"),
    "Libertés, Indépendants, Outre-mer et Territoires": ("LIOT", "#2ed9c3"),
    "Gauche Démocrate et Républicaine": ("GDR", "#830e21"),
    "Union des Droites pour la République": ("UDR", "#064c8b"),
}

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


# Tables rebuilt from scratch by DROP + recreate. They hold no source data
# (they are re-derived by compute_similarities.py right after), so serving them
# empty for the duration of the ingest is acceptable.
DERIVED_TABLES = {
    "voter_voter_similarity",
    "voter_group_similarity",
    "group_group_similarity",
    "group_cohesivity",
    "voter_embedding",
    "group_embedding",
    "category_discriminativeness",
    "computation_meta",
}

# Never touched. config_set and request_metric are the only tables holding data
# that is not re-derivable from the parliament DB. request_metric also holds a FK
# to config_set, which is why dropping config_set fails with
# DependentObjectsStillExistError when request_metric survives.
PRESERVED_TABLES = {"request_metric", "config_set"}

# Name-keyed reference data reconciled in place by refresh_dimension() instead of
# being wiped, so that surviving rows keep their ids. These MUST NOT be part of the
# bulk DELETE below: wiping them first would make refresh_dimension() re-insert every
# row and renumber all ids (the frontend persists category ids in localStorage).
DIMENSION_TABLES = {"groups", "roles", "commissions", "categories"}


async def refresh_dimension(
    session, model, desired: dict[str, dict]
) -> dict[str, object]:
    """Reconcile a name-keyed dimension table, keeping surviving row ids stable.

    The frontend persists category *ids* in localStorage
    (`voting:selectedCategories`), so ids must not be reshuffled on every
    ingest. Only vanished names are deleted and only new names inserted; rows
    that still exist keep their id.
    """
    existing = {
        row.name: row
        for row in (await session.execute(select(model))).scalars().all()
    }
    for name, row in existing.items():
        if name not in desired:
            await session.delete(row)
    result: dict[str, object] = {}
    for name, attrs in desired.items():
        row = existing.get(name)
        if row is None:
            row = model(name=name, **attrs)
            session.add(row)
        else:
            for key, value in attrs.items():
                setattr(row, key, value)
        result[name] = row
    await session.flush()
    return result


async def ingest():
    parl_engine = create_async_engine(PARLIAMENT_DB_URL, echo=False)
    target_engine = create_async_engine(settings.DATABASE_URL, echo=False)

    try:
        derived = [t for t in Base.metadata.sorted_tables if t.name in DERIVED_TABLES]
        fact = [
            t for t in Base.metadata.sorted_tables
            if t.name not in DERIVED_TABLES
            and t.name not in PRESERVED_TABLES
            and t.name not in DIMENSION_TABLES
        ]

        # Everything below runs in ONE transaction. Readers therefore never observe
        # an intermediate state: under MVCC they keep seeing the previous rows until
        # commit, then flip atomically to the new ones.
        #
        # This is also why the fact tables are DELETEd rather than DROPped.
        # DROP TABLE needs ACCESS EXCLUSIVE, which blocks concurrent SELECTs until
        # commit; DELETE only needs ROW EXCLUSIVE, which does not conflict with the
        # ACCESS SHARE a reader holds. The trade-off is transient bloat: dead tuples
        # are not reusable until commit, so peak disk for `answers` roughly doubles.
        async with target_engine.begin() as conn:
            # The derived-table DDL below needs ACCESS EXCLUSIVE, and *any* session
            # sitting idle in a transaction holds ACCESS SHARE on the catalogs it
            # read -- so a single stuck API request would block the ingest forever
            # with no output. Fail fast instead: the transaction rolls back (base
            # data is untouched) and the daily run reports the lock, then retries.
            if conn.dialect.name == "postgresql":
                timeout = os.environ.get("INGEST_LOCK_TIMEOUT", "60s")
                await conn.execute(text(f"SET LOCAL lock_timeout = '{timeout}'"))
            print("Rebuilding derived (similarity) tables...")
            await conn.run_sync(Base.metadata.drop_all, tables=derived)
            await conn.run_sync(Base.metadata.create_all)

            print("Clearing fact tables (rows stay invisible to readers)...")
            for table in reversed(fact):
                await conn.execute(table.delete())

            async with async_sessionmaker(bind=conn, expire_on_commit=False)() as session:
                summary = await _populate(session, parl_engine)

        # --- Summary ---
        async with async_sessionmaker(target_engine, expire_on_commit=False)() as session:
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
        print(f"  Absent:     {summary['absent']}")
        print(f"  Abstention: {summary['abstention']}")
        print(f"  Voted:      {summary['voted']}")
    finally:
        # Dispose even on failure: an undisposed asyncpg/aiosqlite connection
        # keeps its worker thread/transport alive and the process never exits.
        await parl_engine.dispose()
        await target_engine.dispose()


async def _populate(session, parl_engine) -> dict[str, int]:
    """Fill the target tables from the parliament DB (inside the open transaction).

    Dimension tables (groups, roles, commissions, categories) are reconciled by
    name so surviving rows keep their ids; fact tables (voters, votes,
    vote_category, answers) are re-inserted wholesale, which on Postgres lets
    their sequences advance so ids stay monotonic across ingests.
    """
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
    groups = await refresh_dimension(
        session, Group,
        {
            name: dict(zip(("name_short", "color"), GROUPS.get(name, (None, "#999999"))))
            for name in group_names
        },
    )
    group_map = {name: g.id for name, g in groups.items()}

    # --- Roles ---
    print("Inserting roles...")
    role_names = sorted({
        normalize_role(m[4]) for m in members
        if normalize_role(m[4]) is not None
    })
    roles = await refresh_dimension(
        session, Role, {name: {} for name in role_names}
    )
    role_map = {name: r.id for name, r in roles.items()}

    # --- Commissions ---
    print("Inserting commissions...")
    commission_names = sorted({m[5].strip() for m in members if m[5] and m[5].strip()})
    commissions = await refresh_dimension(
        session, Commission, {name: {} for name in commission_names}
    )
    commission_map = {name: c.id for name, c in commissions.items()}

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
            text("SELECT id, title, categories, description, date FROM votes ORDER BY id")
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
    categories = await refresh_dimension(
        session, Category, {name: {} for name in unique_cats}
    )
    cat_map = dict(categories)

    # --- Votes ---
    print("Inserting votes...")
    vote_objects = []
    for v_data in votes_data:
        title = v_data[1]
        cats = v_data[2] or []
        description = v_data[3] or None
        date = v_data[4] if v_data[4] else None
        cat_objs = [cat_map[normalize_cat(c)] for c in cats if normalize_cat(c) in cat_map]
        vote_obj = Vote(text=title, description=description, date=date)
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
    await session.flush()

    return {
        "absent": total_absent,
        "abstention": total_abstention,
        "voted": total_voted,
    }


async def count_votes() -> None:
    """Print how many votes the target DB holds (0 on any failure).

    Used by batch/update-data.sh to detect drift against the parliament DB, so
    a failed ingest self-heals on the next run instead of being masked by the
    "nothing new crawled" fast path. Reporting 0 on failure is deliberate: it
    reads as drift, and re-ingesting is idempotent.
    """
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    try:
        async with async_sessionmaker(engine, expire_on_commit=False)() as session:
            count = (await session.execute(
                select(func.count()).select_from(Vote)
            )).scalar()
        print(int(count or 0))
    except Exception as error:
        print(f"WARNING: vote count failed: {error}", file=sys.stderr)
        print(0)
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--count-votes",
        action="store_true",
        help="print the vote count of the target DB and exit (no ingest)",
    )
    args = parser.parse_args()
    if args.count_votes:
        asyncio.run(count_votes())
    else:
        asyncio.run(ingest())


if __name__ == "__main__":
    main()
