from dataclasses import dataclass

import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Answer,
    Category,
    Group,
    Voter,
    Vote,
    vote_category,
)


@dataclass
class SimilarityConfig:
    w_yes: float = 1.0
    w_no: float = 0.2
    w_mismatch: float = 0.5
    m: int = 10


@dataclass
class AnswerData:
    voter_ids: np.ndarray
    vote_ids: np.ndarray
    yes_matrix: np.ndarray
    no_matrix: np.ndarray
    mask_matrix: np.ndarray
    voter_id_to_idx: dict
    vote_id_to_idx: dict
    group_members: dict
    category_votes: dict


async def load_answer_data(session: AsyncSession) -> AnswerData:
    result = await session.execute(select(Voter.id).order_by(Voter.id))
    voter_ids = np.array([r[0] for r in result.all()])
    voter_id_to_idx = {int(pid): i for i, pid in enumerate(voter_ids)}

    result = await session.execute(select(Vote.id).order_by(Vote.id))
    vote_ids = np.array([r[0] for r in result.all()])
    vote_id_to_idx = {int(vid): i for i, vid in enumerate(vote_ids)}

    n_voters = len(voter_ids)
    n_votes = len(vote_ids)

    mask_matrix = np.zeros((n_voters, n_votes), dtype=np.float64)
    yes_matrix = np.zeros((n_voters, n_votes), dtype=np.float64)
    no_matrix = np.zeros((n_voters, n_votes), dtype=np.float64)

    result = await session.execute(
        select(Answer.voter_id, Answer.vote_id, Answer.value)
        .where(Answer.answered)
    )
    for pid, vid, value in result.all():
        i = voter_id_to_idx[pid]
        j = vote_id_to_idx[vid]
        mask_matrix[i, j] = 1.0
        if value:
            yes_matrix[i, j] = 1.0
        else:
            no_matrix[i, j] = 1.0

    result = await session.execute(select(Group.id).order_by(Group.id))
    group_ids = [r[0] for r in result.all()]

    group_members = {}
    for gid in group_ids:
        result = await session.execute(
            select(Voter.id).where(Voter.group_id == gid).order_by(Voter.id)
        )
        group_members[int(gid)] = [int(r[0]) for r in result.all()]

    result = await session.execute(select(Category.id).order_by(Category.id))
    category_ids = [r[0] for r in result.all()]

    category_votes = {}
    for cid in category_ids:
        result = await session.execute(
            select(vote_category.c.vote_id)
            .where(vote_category.c.category_id == cid)
            .order_by(vote_category.c.vote_id)
        )
        vids = [r[0] for r in result.all()]
        category_votes[int(cid)] = [
            vote_id_to_idx[vid] for vid in vids if vid in vote_id_to_idx
        ]

    return AnswerData(
        voter_ids=voter_ids,
        vote_ids=vote_ids,
        yes_matrix=yes_matrix,
        no_matrix=no_matrix,
        mask_matrix=mask_matrix,
        voter_id_to_idx=voter_id_to_idx,
        vote_id_to_idx=vote_id_to_idx,
        group_members=group_members,
        category_votes=category_votes,
    )


def compute_pairwise(yes_mat, no_mat, mask_mat, config):
    both_yes = yes_mat @ yes_mat.T
    both_no = no_mat @ no_mat.T
    shared = mask_mat @ mask_mat.T
    differ = shared - both_yes - both_no

    numerator = config.w_yes * both_yes + config.w_no * both_no - config.w_mismatch * differ
    max_possible = config.w_yes * shared

    with np.errstate(divide="ignore", invalid="ignore"):
        raw_sim = np.where(max_possible > 0, numerator / max_possible, 0.0)
    shared_count = shared.astype(np.int32)

    return raw_sim, shared_count


def apply_bayesian_shrinkage(raw_sim, shared_count, m):
    n = raw_sim.shape[0]
    if n < 2:
        return raw_sim.copy(), np.zeros_like(raw_sim, dtype=np.float64), 0.0

    upper_idx = np.triu_indices(n, k=1)
    global_mean = float(np.mean(raw_sim[upper_idx]))

    shared_f = shared_count.astype(np.float64)
    confidence = np.where(shared_f + m > 0, shared_f / (shared_f + m), 0.0)

    similarity = confidence * raw_sim + (1 - confidence) * global_mean

    return similarity, confidence, global_mean


@dataclass
class VoterVoterData:
    voter_a_ids: np.ndarray
    voter_b_ids: np.ndarray
    similarity: np.ndarray
    raw_similarity: np.ndarray
    shared_count: np.ndarray
    confidence: np.ndarray
    cat_similarities: dict
    cat_shared_counts: dict | None = None


def compute_voter_voter_data(
    data, raw_sim, similarity, shared_count, confidence, cat_similarities,
    cat_shared_counts=None,
):
    n = len(data.voter_ids)
    i_idx, j_idx = np.triu_indices(n, k=1)

    cat_sims = {}
    if cat_similarities:
        for cat_id, cat_sim in cat_similarities.items():
            cat_sims[cat_id] = cat_sim[i_idx, j_idx]

    cat_shares = {}
    if cat_shared_counts:
        for cat_id, cat_shared in cat_shared_counts.items():
            cat_shares[cat_id] = cat_shared[i_idx, j_idx]

    return VoterVoterData(
        voter_a_ids=data.voter_ids[i_idx],
        voter_b_ids=data.voter_ids[j_idx],
        similarity=similarity[i_idx, j_idx],
        raw_similarity=raw_sim[i_idx, j_idx],
        shared_count=shared_count[i_idx, j_idx],
        confidence=confidence[i_idx, j_idx],
        cat_similarities=cat_sims,
        cat_shared_counts=cat_shares or None,
    )


def _avg_cross_group(sim_matrix, indices_a, indices_b):
    sub = sim_matrix[np.ix_(indices_a, indices_b)]
    return float(np.mean(sub))


def _avg_intra_group(sim_matrix, indices):
    n = len(indices)
    if n < 2:
        return 1.0
    sub = sim_matrix[np.ix_(indices, indices)]
    return float(np.mean(sub[np.triu_indices(n, k=1)]))


def compute_voter_group_records(data, similarity, cat_similarities, cat_shared_counts, config):
    records = []
    group_ids = list(data.group_members.keys())
    cat_v_indices = {
        cat_id: np.array(v_indices, dtype=int)
        for cat_id, v_indices in data.category_votes.items()
        if v_indices
    }

    for gid in group_ids:
        member_ids = data.group_members[gid]
        member_indices = np.array([data.voter_id_to_idx[pid] for pid in member_ids])

        for pid in data.voter_ids:
            p_idx = data.voter_id_to_idx[pid]

            other_indices = member_indices[member_indices != p_idx]
            if len(other_indices) > 0:
                avg_sim = float(np.mean(similarity[p_idx, other_indices]))
                group_mask = np.any(
                    data.mask_matrix[other_indices], axis=0
                ).astype(np.float64)
            else:
                avg_sim = 0.0
                group_mask = np.zeros(data.mask_matrix.shape[1], dtype=np.float64)

            voter_mask = data.mask_matrix[p_idx]
            shared = int(np.sum(voter_mask * group_mask))

            conf = shared / (shared + config.m) if shared + config.m > 0 else 0.0

            per_category = {}
            per_category_shared = {}
            if cat_similarities and len(other_indices) > 0:
                for cat_id, cat_sim in cat_similarities.items():
                    key_str = str(cat_id)
                    per_category[key_str] = float(
                        np.mean(cat_sim[p_idx, other_indices])
                    )
                    if isinstance(cat_id, str):
                        parts = [int(x) for x in cat_id.split("_")]
                        vi = get_intersection_vote_indices(data, parts)
                    else:
                        vi = cat_v_indices.get(cat_id)
                    if vi is not None and len(vi) > 0:
                        vi_arr = np.asarray(vi, dtype=int)
                        v_mask = voter_mask[vi_arr].astype(np.float64)
                        g_mask = group_mask[vi_arr].astype(np.float64)
                        per_category_shared[key_str] = int(np.sum(v_mask * g_mask))

            records.append(
                {
                    "voter_id": int(pid),
                    "group_id": int(gid),
                    "similarity": avg_sim,
                    "shared_count": shared,
                    "confidence": conf,
                    "per_category": per_category if per_category else None,
                    "per_category_shared": per_category_shared if per_category_shared else None,
                }
            )

    return records


def compute_per_category_pairwise(data, config):
    cat_similarities = {}
    cat_shared_counts = {}
    for cat_id, v_indices in data.category_votes.items():
        if not v_indices:
            continue
        cat_yes = data.yes_matrix[:, v_indices]
        cat_no = data.no_matrix[:, v_indices]
        cat_mask = data.mask_matrix[:, v_indices]
        cat_raw, cat_shared = compute_pairwise(cat_yes, cat_no, cat_mask, config)
        cat_sim, _, _ = apply_bayesian_shrinkage(cat_raw, cat_shared, config.m)
        cat_similarities[cat_id] = cat_sim
        cat_shared_counts[cat_id] = cat_shared
    return cat_similarities, cat_shared_counts


def make_categories_key(cat_ids: list[int]) -> str:
    return "_".join(str(c) for c in sorted(cat_ids))


def get_intersection_vote_indices(
    data: AnswerData, cat_ids: list[int]
) -> list[int]:
    if len(cat_ids) == 0:
        return list(range(data.yes_matrix.shape[1]))
    if len(cat_ids) == 1:
        return list(data.category_votes.get(cat_ids[0], []))
    sets = [
        set(data.category_votes[cid])
        for cid in cat_ids
        if cid in data.category_votes
    ]
    if not sets:
        return []
    intersection = set.intersection(*sets)
    return sorted(intersection)


def compute_pairwise_for_combination(
    data: AnswerData, cat_ids: list[int], config: SimilarityConfig
) -> tuple[np.ndarray | None, np.ndarray | None]:
    v_indices = get_intersection_vote_indices(data, cat_ids)
    if len(v_indices) < 2:
        return None, None
    yes = data.yes_matrix[:, v_indices]
    no = data.no_matrix[:, v_indices]
    mask = data.mask_matrix[:, v_indices]
    raw, shared = compute_pairwise(yes, no, mask, config)
    sim, _, _ = apply_bayesian_shrinkage(raw, shared, config.m)
    return sim, shared


def compute_group_group_records(data, similarity, cat_similarities, config):
    group_ids = list(data.group_members.keys())
    records = []

    group_indices = {
        gid: np.array([data.voter_id_to_idx[pid] for pid in data.group_members[gid]])
        for gid in group_ids
    }

    for i, ga_id in enumerate(group_ids):
        for j, gb_id in enumerate(group_ids):
            if i >= j:
                continue

            avg_sim = _avg_cross_group(
                similarity, group_indices[ga_id], group_indices[gb_id]
            )

            n_a = len(group_indices[ga_id])
            n_b = len(group_indices[gb_id])
            shared_count = min(n_a, n_b)
            confidence = shared_count / (shared_count + config.m) if shared_count > 0 else 0.0

            per_category = {}
            for cat_id, cat_sim in cat_similarities.items():
                cat_avg = _avg_cross_group(
                    cat_sim, group_indices[ga_id], group_indices[gb_id]
                )
                per_category[str(cat_id)] = cat_avg

            records.append(
                {
                    "group_a_id": int(ga_id),
                    "group_b_id": int(gb_id),
                    "similarity": avg_sim,
                    "shared_count": shared_count,
                    "confidence": confidence,
                    "per_category": per_category if per_category else None,
                }
            )

    return records


def compute_cohesivity_records(data, similarity, cat_similarities):
    group_ids = list(data.group_members.keys())
    records = []

    group_indices = {
        gid: np.array([data.voter_id_to_idx[pid] for pid in data.group_members[gid]])
        for gid in group_ids
    }

    for gid in group_ids:
        cohesivity = _avg_intra_group(similarity, group_indices[gid])

        per_category = {}
        for cat_id, cat_sim in cat_similarities.items():
            cat_coh = _avg_intra_group(cat_sim, group_indices[gid])
            per_category[str(cat_id)] = cat_coh

        records.append(
            {
                "group_id": int(gid),
                "cohesivity": cohesivity,
                "per_category": per_category if per_category else None,
            }
        )

    return records
