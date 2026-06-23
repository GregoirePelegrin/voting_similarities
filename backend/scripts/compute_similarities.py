import argparse
import asyncio
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import delete, insert, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.models import GroupCohesivity, GroupGroupSim, PersonGroupSim, PersonPersonSim
from app.similarity import (
    SimilarityConfig,
    apply_bayesian_shrinkage,
    compute_cohesivity_records,
    compute_group_group_records,
    compute_person_group_records,
    compute_person_person_data,
    compute_pairwise,
    compute_per_category_pairwise,
    load_answer_data,
)

CHUNK_SIZE = 5000


def _pp_data_to_rows(pp_data, offset, size):
    end = min(offset + size, len(pp_data.person_a_ids))
    has_cats = bool(pp_data.cat_similarities)
    rows = []
    for k in range(offset, end):
        row = {
            "person_a_id": int(pp_data.person_a_ids[k]),
            "person_b_id": int(pp_data.person_b_ids[k]),
            "similarity": float(pp_data.similarity[k]),
            "raw_similarity": float(pp_data.raw_similarity[k]),
            "shared_count": int(pp_data.shared_count[k]),
            "confidence": float(pp_data.confidence[k]),
        }
        if has_cats:
            row["per_category"] = {
                str(cat_id): float(cat_arr[k])
                for cat_id, cat_arr in pp_data.cat_similarities.items()
            }
        rows.append(row)
    return rows


async def run(config: SimilarityConfig):
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        print("Loading answer data...")
        data = await load_answer_data(session)
        print(f"  {len(data.person_ids)} people, {len(data.question_ids)} questions")

        print("Computing pairwise similarity...")
        raw_sim, shared_count = compute_pairwise(
            data.yes_matrix, data.no_matrix, data.mask_matrix, config
        )
        similarity, confidence, global_mean = apply_bayesian_shrinkage(
            raw_sim, shared_count, config.m
        )
        print(f"  Global mean raw similarity: {global_mean:.4f}")

        print("Computing per-category similarities...")
        cat_similarities = compute_per_category_pairwise(data, config)
        print(f"  {len(cat_similarities)} categories")

        print("Clearing existing similarity data...")
        await session.execute(delete(PersonPersonSim))
        await session.execute(delete(PersonGroupSim))
        await session.execute(delete(GroupGroupSim))
        await session.execute(delete(GroupCohesivity))
        await session.flush()

        print("Storing person-person similarity...")
        pp_data = compute_person_person_data(
            data, raw_sim, similarity, shared_count, confidence, cat_similarities
        )
        n_pp = len(pp_data.person_a_ids)
        print(f"  {n_pp} pairs")
        for offset in range(0, n_pp, CHUNK_SIZE):
            rows = _pp_data_to_rows(pp_data, offset, CHUNK_SIZE)
            await session.execute(insert(PersonPersonSim), rows)
        await session.flush()

        print("Storing person-group similarity...")
        pg_records = compute_person_group_records(data, similarity, config)
        print(f"  {len(pg_records)} pairs")
        for i in range(0, len(pg_records), CHUNK_SIZE):
            await session.execute(insert(PersonGroupSim), pg_records[i : i + CHUNK_SIZE])
        await session.flush()

        print("Storing group-group similarity...")
        gg_records = compute_group_group_records(data, similarity, cat_similarities)
        print(f"  {len(gg_records)} pairs")
        for i in range(0, len(gg_records), CHUNK_SIZE):
            await session.execute(insert(GroupGroupSim), gg_records[i : i + CHUNK_SIZE])
        await session.flush()

        print("Storing group cohesivity...")
        gc_records = compute_cohesivity_records(data, similarity, cat_similarities)
        print(f"  {len(gc_records)} groups")
        for i in range(0, len(gc_records), CHUNK_SIZE):
            await session.execute(insert(GroupCohesivity), gc_records[i : i + CHUNK_SIZE])

        await session.commit()
        print("Done!")

    await engine.dispose()


def main():
    parser = argparse.ArgumentParser(
        description="Compute pairwise and group similarity scores"
    )
    parser.add_argument(
        "--w-yes", type=float, default=1.0, help="Weight for Yes-Yes agreement"
    )
    parser.add_argument(
        "--w-no", type=float, default=0.2, help="Weight for No-No agreement"
    )
    parser.add_argument(
        "--w-mismatch", type=float, default=0.5, help="Penalty for disagreement"
    )
    parser.add_argument(
        "--m", type=int, default=10, help="Bayesian shrinkage parameter"
    )
    args = parser.parse_args()

    config = SimilarityConfig(
        w_yes=args.w_yes,
        w_no=args.w_no,
        w_mismatch=args.w_mismatch,
        m=args.m,
    )

    print(
        f"Config: w_yes={config.w_yes}, w_no={config.w_no}, "
        f"w_mismatch={config.w_mismatch}, m={config.m}"
    )

    asyncio.run(run(config))


if __name__ == "__main__":
    main()
