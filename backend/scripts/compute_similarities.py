import argparse
import asyncio
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import settings
from app.embedding import classical_mds
from app.models import (
    Base,
    Category,
    CategoryDiscriminativeness,
    GroupCohesivity,
    GroupEmbedding,
    GroupGroupSim,
    VoterEmbedding,
    VoterGroupSim,
    VoterVoterSim,
)
from app.similarity import (
    SimilarityConfig,
    apply_bayesian_shrinkage,
    compute_cohesivity_records,
    compute_group_group_records,
    compute_pairwise,
    compute_per_category_pairwise,
    compute_voter_group_records,
    compute_voter_voter_data,
    load_answer_data,
)
from sqlalchemy import delete, insert, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

CHUNK_SIZE = 5000


def _vv_data_to_rows(vv_data, offset, size):
    end = min(offset + size, len(vv_data.voter_a_ids))
    has_cats = bool(vv_data.cat_similarities)
    rows = []
    for k in range(offset, end):
        row = {
            "voter_a_id": int(vv_data.voter_a_ids[k]),
            "voter_b_id": int(vv_data.voter_b_ids[k]),
            "similarity": float(vv_data.similarity[k]),
            "raw_similarity": float(vv_data.raw_similarity[k]),
            "shared_count": int(vv_data.shared_count[k]),
            "confidence": float(vv_data.confidence[k]),
        }
        if has_cats:
            row["per_category"] = {
                str(cat_id): float(cat_arr[k])
                for cat_id, cat_arr in vv_data.cat_similarities.items()
            }
        rows.append(row)
    return rows


async def run(config: SimilarityConfig):
    engine = create_async_engine(settings.DATABASE_URL, echo=settings.DB_ECHO)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        print("Loading answer data...")
        data = await load_answer_data(session)
        print(f"  {len(data.voter_ids)} voters, {len(data.question_ids)} questions")

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
        await session.execute(delete(VoterVoterSim))
        await session.execute(delete(VoterGroupSim))
        await session.execute(delete(GroupGroupSim))
        await session.execute(delete(GroupCohesivity))
        await session.flush()

        print("Storing voter-voter similarity...")
        vv_data = compute_voter_voter_data(
            data, raw_sim, similarity, shared_count, confidence, cat_similarities
        )
        n_vv = len(vv_data.voter_a_ids)
        print(f"  {n_vv} pairs")
        for offset in range(0, n_vv, CHUNK_SIZE):
            rows = _vv_data_to_rows(vv_data, offset, CHUNK_SIZE)
            await session.execute(insert(VoterVoterSim), rows)
        await session.flush()

        print("Storing voter-group similarity...")
        vg_records = compute_voter_group_records(data, similarity, cat_similarities, config)
        print(f"  {len(vg_records)} pairs")
        for i in range(0, len(vg_records), CHUNK_SIZE):
            await session.execute(insert(VoterGroupSim), vg_records[i : i + CHUNK_SIZE])
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
        await session.flush()

        print("Computing MDS embeddings...")
        await session.execute(delete(VoterEmbedding))
        await session.execute(delete(GroupEmbedding))
        await session.flush()

        group_ids = list(data.group_members.keys())
        voter_ids = data.voter_ids

        print("  Global voter embedding...")
        global_coords, global_stress = classical_mds(similarity)
        print(f"    stress: {global_stress:.4f}")
        ve_rows = [
            {
                "voter_id": int(voter_ids[i]),
                "category_id": None,
                "x": float(global_coords[i, 0]),
                "y": float(global_coords[i, 1]),
                "stress": global_stress,
            }
            for i in range(len(voter_ids))
        ]
        for i in range(0, len(ve_rows), CHUNK_SIZE):
            await session.execute(insert(VoterEmbedding), ve_rows[i : i + CHUNK_SIZE])
        await session.flush()

        for cat_id, cat_sim in cat_similarities.items():
            print(f"  Voter embedding for category {cat_id}...")
            cat_coords, cat_stress = classical_mds(cat_sim)
            print(f"    stress: {cat_stress:.4f}")
            cat_ve_rows = [
                {
                    "voter_id": int(voter_ids[i]),
                    "category_id": cat_id,
                    "x": float(cat_coords[i, 0]),
                    "y": float(cat_coords[i, 1]),
                    "stress": cat_stress,
                }
                for i in range(len(voter_ids))
            ]
            for i in range(0, len(cat_ve_rows), CHUNK_SIZE):
                await session.execute(insert(VoterEmbedding), cat_ve_rows[i : i + CHUNK_SIZE])
            await session.flush()

        gg_sim_matrix = np.zeros((len(group_ids), len(group_ids)))
        np.fill_diagonal(gg_sim_matrix, 1.0)
        gid_to_idx = {gid: i for i, gid in enumerate(group_ids)}
        for rec in gg_records:
            i, j = gid_to_idx[rec["group_a_id"]], gid_to_idx[rec["group_b_id"]]
            gg_sim_matrix[i, j] = rec["similarity"]
            gg_sim_matrix[j, i] = rec["similarity"]

        print("  Global group embedding...")
        g_coords, g_stress = classical_mds(gg_sim_matrix)
        print(f"    stress: {g_stress:.4f}")
        ge_rows = [
            {
                "group_id": group_ids[i],
                "category_id": None,
                "x": float(g_coords[i, 0]),
                "y": float(g_coords[i, 1]),
                "stress": g_stress,
            }
            for i in range(len(group_ids))
        ]
        await session.execute(insert(GroupEmbedding), ge_rows)
        await session.flush()

        for cat_id in cat_similarities:
            print(f"  Group embedding for category {cat_id}...")
            cat_gg = np.zeros((len(group_ids), len(group_ids)))
            np.fill_diagonal(cat_gg, 1.0)
            for rec in gg_records:
                if rec["per_category"] and str(cat_id) in rec["per_category"]:
                    i, j = gid_to_idx[rec["group_a_id"]], gid_to_idx[rec["group_b_id"]]
                    val = rec["per_category"][str(cat_id)]
                    cat_gg[i, j] = val
                    cat_gg[j, i] = val
            cat_g_coords, cat_g_stress = classical_mds(cat_gg)
            print(f"    stress: {cat_g_stress:.4f}")
            cat_ge_rows = [
                {
                    "group_id": group_ids[i],
                    "category_id": cat_id,
                    "x": float(cat_g_coords[i, 0]),
                    "y": float(cat_g_coords[i, 1]),
                    "stress": cat_g_stress,
                }
                for i in range(len(group_ids))
            ]
            await session.execute(insert(GroupEmbedding), cat_ge_rows)
            await session.flush()

        # --- Category discriminativeness ---
        print("Computing category discriminativeness...")
        await session.execute(delete(CategoryDiscriminativeness))
        await session.flush()

        cat_names = {}
        cat_result = await session.execute(select(Category).order_by(Category.id))
        for cat in cat_result.scalars().all():
            cat_names[cat.id] = cat.name

        voter_group_map = {}
        for pid in data.voter_ids:
            for gid, members in data.group_members.items():
                if pid in members:
                    voter_group_map[int(pid)] = int(gid)
                    break

        group_ids_int = [int(gid) for gid in group_ids]
        n_groups = len(group_ids_int)
        gid_to_pos = {gid: i for i, gid in enumerate(group_ids_int)}
        group_sizes = np.array([len(data.group_members[gid]) for gid in group_ids])
        p_group = group_sizes / group_sizes.sum()
        h_group = -float(np.sum(p_group * np.log(p_group + 1e-15)))

        cd_rows = []
        for cat_id in sorted(cat_similarities.keys()):
            cat_sim = cat_similarities[cat_id]

            predictions = np.zeros(len(data.voter_ids), dtype=int)
            for p_local_idx in range(len(data.voter_ids)):
                pid = int(data.voter_ids[p_local_idx])
                best_gid = group_ids_int[0]
                best_sim = -np.inf
                for gid in group_ids_int:
                    members = data.group_members[gid]
                    member_indices = np.array(
                        [data.voter_id_to_idx[m] for m in members if m != pid]
                    )
                    if len(member_indices) > 0:
                        sim = float(np.mean(cat_sim[p_local_idx, member_indices]))
                    else:
                        sim = -np.inf
                    if sim > best_sim:
                        best_sim = sim
                        best_gid = gid
                predictions[p_local_idx] = best_gid

            contingency = np.zeros((n_groups, n_groups))
            for p_local_idx in range(len(data.voter_ids)):
                pid = int(data.voter_ids[p_local_idx])
                actual_gid = voter_group_map.get(pid)
                predicted_gid = predictions[p_local_idx]
                if actual_gid is not None and actual_gid in gid_to_pos:
                    contingency[gid_to_pos[actual_gid], gid_to_pos[predicted_gid]] += 1

            row_sums = contingency.sum(axis=1, keepdims=True)
            col_sums = contingency.sum(axis=0, keepdims=True)
            total = contingency.sum()

            mi = 0.0
            for i in range(n_groups):
                for j in range(n_groups):
                    p_joint = contingency[i, j] / total if total > 0 else 0
                    p_row = row_sums[i, 0] / total if total > 0 else 0
                    p_col = col_sums[0, j] / total if total > 0 else 0
                    if p_joint > 0 and p_row > 0 and p_col > 0:
                        mi += p_joint * np.log(p_joint / (p_row * p_col))

            normalized_ig = mi / h_group if h_group > 0 else 0.0

            cat_gg_sims = []
            for rec in gg_records:
                if rec["per_category"] and str(cat_id) in rec["per_category"]:
                    cat_gg_sims.append(rec["per_category"][str(cat_id)])
            variance_score = float(np.var(cat_gg_sims)) if cat_gg_sims else 0.0

            per_group_breakdown = {}
            for i, gid in enumerate(group_ids_int):
                n_actual = row_sums[i, 0]
                if n_actual > 0:
                    accuracy = float(contingency[i, i] / n_actual)
                else:
                    accuracy = 0.0

                non_diag = np.delete(contingency[i], i)
                most_confused_pos = int(np.argmax(non_diag))
                if most_confused_pos >= i:
                    most_confused_pos += 1
                most_confused_gid = group_ids_int[most_confused_pos] if n_groups > 1 else None

                if n_actual > 0:
                    p_pred_given = contingency[i] / n_actual
                else:
                    p_pred_given = np.ones(n_groups) / n_groups
                if total > 0:
                    p_pred_overall = col_sums[0] / total
                else:
                    p_pred_overall = np.ones(n_groups) / n_groups
                mask = p_pred_given > 0
                kl = float(np.sum(
                    p_pred_given[mask] * np.log(
                        p_pred_given[mask] / p_pred_overall[mask]
                    )
                )) if mask.any() else 0.0

                most_confused_sim = None
                if most_confused_gid is not None:
                    for rec in gg_records:
                        a, b = rec["group_a_id"], rec["group_b_id"]
                        pair_match = (
                            (a == gid and b == most_confused_gid)
                            or (b == gid and a == most_confused_gid)
                        )
                        if pair_match:
                            pc = rec.get("per_category")
                            most_confused_sim = (
                                pc.get(str(cat_id)) if pc else None
                            )
                            break

                per_group_breakdown[str(gid)] = {
                    "accuracy": accuracy,
                    "most_confused_with": most_confused_gid,
                    "most_confused_similarity": most_confused_sim,
                    "kl_divergence": kl,
                }

            cd_rows.append({
                "category_id": int(cat_id),
                "info_gain": float(mi),
                "normalized_ig": float(normalized_ig),
                "variance_score": float(variance_score),
                "per_group_breakdown": per_group_breakdown,
            })

        if cd_rows:
            await session.execute(insert(CategoryDiscriminativeness), cd_rows)
            await session.flush()
        print(f"  {len(cd_rows)} categories processed")

        await session.commit()
        print("Done!")

    await engine.dispose()


def main():
    parser = argparse.ArgumentParser(
        description="Compute pairwise and group similarity scores"
    )
    parser.add_argument(
        "--w-yes", type=float, default=settings.SIMILARITY_W_YES,
        help="Weight for Yes-Yes agreement"
    )
    parser.add_argument(
        "--w-no", type=float, default=settings.SIMILARITY_W_NO,
        help="Weight for No-No agreement"
    )
    parser.add_argument(
        "--w-mismatch", type=float, default=settings.SIMILARITY_W_MISMATCH,
        help="Penalty for disagreement"
    )
    parser.add_argument(
        "--m", type=int, default=settings.SIMILARITY_BAYESIAN_M,
        help="Bayesian shrinkage parameter"
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
