from __future__ import annotations

import logging

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from prince import MCA
from sklearn.cluster import KMeans
from sklearn.impute import KNNImputer

from parliament_data_extractor.analysis.annotated_graph import hover_annotated_scatter
from parliament_data_extractor.common.services.database import Database

log = logging.getLogger(__name__)

EXTREMA_DISPLAY_NUMBER: int = 5
MCA_DEFAULT_COMPONENTS: int = 10
MCA_EXPLAINED_INERTIA_THRESHOLD: float = 0.9
FIXED_CLUSTERS_NUMBER: int = 5
SIMILARITY_CLUSTERS_THRESHOLD: float = 0.9


def generate_base_df(n_rows: int, n_cols: int) -> pd.DataFrame:
    return pd.DataFrame(
        np.random.choice(["Pour", "Contre", np.nan], size=(n_rows, n_cols))
    )


def fill_base_df(df: pd.DataFrame) -> pd.DataFrame:
    imputer = KNNImputer(n_neighbors=2)
    colnames: list[str] = list(df.columns)
    imputed = imputer.fit_transform(df)
    return pd.DataFrame(imputed, columns=colnames)


def compute_dimension_reduction(
    df: pd.DataFrame, n: int = MCA_DEFAULT_COMPONENTS
) -> pd.DataFrame:
    mca = MCA(n_components=n)
    return mca.fit_transform(df)


def compute_mca_n(
    df: pd.DataFrame, threshold: float = MCA_EXPLAINED_INERTIA_THRESHOLD
) -> int:
    for n in range(1, min(df.shape[1], 21)):
        mca = MCA(n_components=n)
        mca.fit(df)
        if mca.explained_inertia_.cumsum().iloc[n - 1] >= threshold:
            return n
    return MCA_DEFAULT_COMPONENTS


def fixed_clusterization(df: pd.DataFrame) -> np.ndarray:
    kmeans = KMeans(n_clusters=FIXED_CLUSTERS_NUMBER, random_state=42, n_init=10)
    return kmeans.fit_predict(df)


def similarity_clusterization(
    reduced_df: pd.DataFrame, threshold: float = SIMILARITY_CLUSTERS_THRESHOLD
) -> np.ndarray:
    from scipy.cluster.hierarchy import fcluster, linkage
    from scipy.spatial.distance import pdist

    dist = pdist(reduced_df, metric="cosine")
    z = linkage(dist, method="ward")
    return fcluster(z, t=threshold, criterion="distance")


def recompute_mca_dimension_reduction(
    df: pd.DataFrame, n_components: int = MCA_DEFAULT_COMPONENTS
) -> pd.DataFrame:
    mca = MCA(n_components=n_components)
    mca = mca.fit(df)
    row_coords = mca.row_coordinates(df)
    inertia_series = mca.explained_inertia_
    log.info(
        "Explained inertia with n=%s components:\n%s",
        n_components,
        inertia_series.to_string(),
    )
    return row_coords


def find_extrema(
    df: pd.DataFrame, clusters: np.ndarray, extrema_number: int = EXTREMA_DISPLAY_NUMBER
) -> dict[int, dict[str, list[tuple[int, float]]]]:
    res: dict[int, dict[str, list[tuple[int, float]]]] = {}
    for cluster_id in np.unique(clusters):
        cluster_indices = np.where(clusters == cluster_id)[0]
        cluster_mca = df.iloc[cluster_indices, :2]
        centroid = cluster_mca.mean()
        distances = np.linalg.norm(
            cluster_mca - centroid.values, axis=1
        )
        sorted_idx = np.argsort(distances)
        farthest = [
            (cluster_indices[i], distances[i])
            for i in sorted_idx[-extrema_number:][::-1]
        ]
        closest = [
            (cluster_indices[i], distances[i])
            for i in sorted_idx[:extrema_number]
        ]
        res[cluster_id] = {"closest": closest, "farthest": farthest}
    return res


def main(source: str = "an"):
    svc = Database.get(source=source)

    base_df: pd.DataFrame = svc.get_votes_dataframe()
    log.info("DataFrame shape: %s", base_df.shape)

    filled_df: pd.DataFrame = fill_base_df(df=base_df)

    mca_n = compute_mca_n(df=filled_df)
    reduced_data: pd.DataFrame = compute_dimension_reduction(df=filled_df, n=mca_n)

    clusters: np.ndarray = fixed_clusterization(df=reduced_data)

    mca_dimension_reduced_data: pd.DataFrame = recompute_mca_dimension_reduction(
        df=filled_df, n_components=mca_n
    )

    log.info("Cluster labels: %s", np.unique(clusters))

    extrema: dict = find_extrema(
        df=mca_dimension_reduced_data, clusters=clusters
    )
    log.info("Extrema: %s", extrema)

    fig, ax = plt.subplots()
    for cluster_id in np.unique(clusters):
        mask = clusters == cluster_id
        ax.scatter(
            mca_dimension_reduced_data.iloc[mask, 0],
            mca_dimension_reduced_data.iloc[mask, 1],
            label=f"Cluster {cluster_id}",
            alpha=0.7,
        )
    ax.legend()
    ax.set_title("MCA - KMeans Clustering")
    ax.set_xlabel("Dimension 1")
    ax.set_ylabel("Dimension 2")

    hover_annotated_scatter(
        x=mca_dimension_reduced_data.iloc[:, 0],
        y=mca_dimension_reduced_data.iloc[:, 1],
        labels=[
            f"Member {i}" for i in range(len(mca_dimension_reduced_data))
        ],
        ax=ax,
        fig=fig,
    )

    plt.show()
