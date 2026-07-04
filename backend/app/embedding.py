import numpy as np


def classical_mds(
    similarity_matrix: np.ndarray, n_components: int = 2
) -> tuple[np.ndarray, float]:
    n = similarity_matrix.shape[0]
    if n <= n_components:
        coords = np.zeros((n, n_components))
        stress = 1.0
        return coords, stress

    dist = similarity_matrix.max() - similarity_matrix
    np.fill_diagonal(dist, 0.0)

    dist_sq = dist ** 2

    h = np.eye(n) - np.ones((n, n)) / n
    b = -0.5 * h @ dist_sq @ h

    eigenvalues, eigenvectors = np.linalg.eigh(b)

    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    top_vals = eigenvalues[:n_components]
    top_vecs = eigenvectors[:, :n_components]

    for k in range(n_components):
        if top_vecs[0, k] < 0:
            top_vecs[:, k] *= -1

    top_vals = np.maximum(top_vals, 0.0)

    coords = top_vecs * np.sqrt(top_vals)

    dist_2d = np.zeros((n, n))
    for i in range(n):
        diff = coords[i] - coords
        dist_2d[i] = np.sqrt(np.sum(diff ** 2, axis=1))

    d_orig_vec = dist[np.triu_indices(n, k=1)]
    d_2d_vec = dist_2d[np.triu_indices(n, k=1)]

    ss_orig = np.sum(d_orig_vec ** 2)
    if ss_orig > 0:
        stress = float(np.sum((d_orig_vec - d_2d_vec) ** 2) / ss_orig)
    else:
        stress = 0.0

    return coords, stress


def compute_group_group_matrix(
    group_ids: list[int],
    gg_similarity: dict[tuple[int, int], float],
    cat_gg_similarity: dict[int, dict[tuple[int, int], float]] | None = None,
    category_id: int | None = None,
    categories_key: str | None = None,
) -> np.ndarray:
    n = len(group_ids)
    gid_to_idx = {gid: i for i, gid in enumerate(group_ids)}
    mat = np.zeros((n, n))
    np.fill_diagonal(mat, 1.0)

    if categories_key is not None and cat_gg_similarity and categories_key in cat_gg_similarity:
        source = cat_gg_similarity[categories_key]
    elif category_id is not None and cat_gg_similarity and category_id in cat_gg_similarity:
        source = cat_gg_similarity[category_id]
    else:
        source = gg_similarity

    for (ga, gb), sim in source.items():
        if ga in gid_to_idx and gb in gid_to_idx:
            i, j = gid_to_idx[ga], gid_to_idx[gb]
            mat[i, j] = sim
            mat[j, i] = sim

    return mat
