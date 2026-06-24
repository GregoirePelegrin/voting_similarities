# Groups Comparison — Project Description & Plan

## Project Description

A web application for analyzing and comparing how individuals and groups vote on yes/no questions. Around 700 participants, organized into ~12 groups, answer a shared set of questions classified into ~12 categories. Not all participants answer every question. The core insight is that agreement through "Yes" is more meaningful than agreement through "No" — two people saying "Yes" to something indicates shared conviction, while saying "No" may reflect different, unrelated reasons for dissent.

### Views

**1. Similarity Map (landing page)**
- 2D scatter plots computed via Classical MDS on the similarity matrix
- **People map**: every person as a point, colored by group, with group barycenters overlaid
- **Groups map**: every group as a point (from group-group MDS)
- Category filter: switch between global and per-category embeddings
- Stress metric displayed to indicate how faithfully 2D represents the full similarity structure
- Hover tooltip: person/group name; click → detail page
- Methodology explanation panel describing MDS, stress, and interpretation

**2. People View**
- Table/list of all people with their answer history
- Click on a person → detail page showing:
  - Their individual answers (filterable by category)
  - Comparison to their own group's aggregate votes
  - Comparison to every other group's aggregate votes
  - Top 5 most similar persons (with similarity score)
  - Top 5 most dissimilar persons (with similarity score)

**3. Groups View**
- Table of all groups with aggregate answer rates per question
- Click on a group → detail page showing:
  - Cohesivity score (how internally similar the members are)
  - All other groups ranked by similarity
  - Per-category breakdown of similarity

---

## MDS Embedding Visualization

### Methodology

The similarity map uses **Classical Multidimensional Scaling (MDS)** to project the high-dimensional similarity structure into 2D. This is the appropriate dimensionality reduction technique when you have a custom distance/similarity metric and want to visualize it faithfully — unlike PCA, which operates on the raw data matrix and would ignore the asymmetric weighting.

**How it works:**

1. **From similarity to distance**: The pairwise similarity matrix `S` (700×700 for people, 12×12 for groups) is converted to a distance matrix: `D = max(S) - S`. This preserves the similarity ordering (most similar pairs are closest) while ensuring non-negative distances.

2. **Double-centering**: The squared distance matrix `D²` is double-centered: `B = -½ H D² H`, where `H = I - (1/n) 11ᵀ` is the centering matrix. This produces a positive semi-definite matrix `B` whose eigendecomposition yields the coordinates.

3. **Eigendecomposition**: The top 2 eigenvalues and their eigenvectors of `B` are extracted (via `numpy.linalg.eigh`). The 2D coordinates are `X = V₂ Λ₂^{½}`, where `V₂` are the top 2 eigenvectors and `Λ₂` the corresponding eigenvalues.

4. **Stress metric**: The normalized stress measures how much information is lost in the 2D projection:
   ```
   stress = ||D_original - D_2D||² / ||D_original||²
   ```
   - stress < 0.1: good fit (2D captures the dominant structure well)
   - 0.1 ≤ stress < 0.2: fair fit (main patterns visible, some distortion)
   - stress ≥ 0.2: poor fit (consider that 2D is a significant reduction)

5. **Per-category embeddings**: A separate MDS is computed for each category using only the per-category similarity submatrix. This means the 2D layout may differ across categories — points that cluster together in one category may spread apart in another.

6. **Group barycenters**: On the people map, each group's barycenter is the mean `(x, y)` of all its members' coordinates. This is *not* a separate MDS — it's an overlay on the person-level map showing where each group's "center of gravity" falls.

7. **Group-group map**: A separate MDS on the 12×12 group-group similarity matrix produces the groups-only view, where each group is a single point.

**Why MDS over PCA**: PCA would project the raw answer matrix (700×100 binary), ignoring the custom asymmetric weighting scheme. MDS operates directly on the similarity matrix, so the resulting 2D layout faithfully reflects *your* metric. The two approaches coincide only when using unweighted Jaccard similarity (which we don't).

### Pre-computed tables

| Table | Rows | Description |
|---|---|---|
| `person_embedding` | 700 × 13 ≈ 9,100 | MDS coordinates per person, per category (NULL = global) |
| `group_embedding` | 12 × 13 ≈ 156 | MDS coordinates per group, per category (NULL = global) |

Both are computed alongside similarities by the batch job and stored with their stress value.

---

## Similarity Metric

### Weighted asymmetric overlap

Since "Yes" agreement is more informative than "No" agreement, we use a **weighted asymmetric overlap** over shared (non-missing) questions:

```
weight(question, person_A, person_B):
  if both answered Yes:  +w_yes     (e.g., 1.0)
  if both answered No:   +w_no      (e.g., 0.2)
  if answers differ:     -w_mismatch (e.g., 0.5)

raw_similarity(A, B) = sum(weights) / sum(max_possible_weights)
```

This ensures:
- Two "Yes" votes contribute strongly to similarity
- Two "No" votes contribute weakly
- Disagreement actively penalizes similarity
- The score is normalized to [−1, 1] or [0, 1] depending on tuning

### Handling sparse voting records (Bayesian shrinkage + threshold)

Some people may have answered very few questions, leading to unreliable similarity scores when their overlap with another person is small. We address this with a two-part strategy:

**1. Bayesian shrinkage toward the global mean**

Blend the raw pair similarity with the global average similarity, weighted by how much evidence (shared question count) the pair has:

```
weight = shared_count / (shared_count + m)
final_score = weight × raw_similarity + (1 - weight) × global_mean_similarity
```

- `m` is a tunable parameter representing "how many shared questions are needed to trust the pair's own data over the global average" (e.g., `m = 10`).
- A pair sharing 50 questions: weight ≈ 0.83 → mostly their own score.
- A pair sharing 3 questions: weight ≈ 0.23 → mostly pulled toward the global mean.
- A pair sharing 0 questions: weight = 0 → fully the global mean.

**2. Confidence stored, threshold configurable in the frontend**

The confidence value (`weight = shared_count / (shared_count + m)`) is stored as a float in the database for every pair. The frontend exposes a configurable threshold (e.g., default 0.3): pairs below this threshold are displayed with a visual warning. Users can adjust the threshold in the UI to explore how confidence affects the reliability of similarity scores.

### Group-level similarity

Group-level similarity is computed by averaging member similarity scores (or using group centroid vectors with the same weighting). Group-group and person-group similarity also apply the same Bayesian shrinkage when the effective overlap is low.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (React + MUI + Recharts)          │
│  - Similarity map (MDS scatter plots)       │
│  - People table / detail views              │
│  - Groups table / detail views              │
│  - Category filtering                       │
│  - Similarity bar charts / heatmaps         │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│  Backend (FastAPI + SQLAlchemy)              │
│  - /embeddings/people, /embeddings/groups    │
│  - /people, /people/{id}                     │
│  - /groups, /groups/{id}                     │
│  - /categories                               │
│  - Serves pre-computed similarity + MDS data │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Database (SQLite / PostgreSQL)              │
│  - people, groups, questions, answers        │
│  - person_person_similarity (pre-computed)   │
│  - person_group_similarity (pre-computed)    │
│  - group_group_similarity (pre-computed)     │
│  - group_cohesivity (pre-computed)           │
│  - person_embedding (pre-computed MDS)       │
│  - group_embedding (pre-computed MDS)        │
└─────────────────────────────────────────────┘
```

---

## Pre-computation Strategy

| Table | Rows | Computation |
|---|---|---|
| `person_person_similarity` | C(700,2) ≈ **245K** | Pairwise weighted overlap |
| `person_group_similarity` | 700 × 12 = **8.4K** | Person vs group centroid |
| `group_group_similarity` | C(12,2) = **66** | Group centroid vs centroid |
| `group_cohesivity` | **12** | Mean intra-group similarity |
| `person_embedding` | 700 × 13 ≈ **9,100** | MDS 2D coordinates per category |
| `group_embedding` | 12 × 13 ≈ **156** | MDS 2D coordinates per category |

All computed via a **batch job** (CLI command) that:
1. Loads all answers into a sparse matrix (people × questions)
2. Computes pairwise similarity using vectorized NumPy operations
3. Stores results in the database
4. Can be re-run whenever new answers are ingested

---

## Data Model

```
Group          id, name
Person         id, name, group_id (FK → Group)
Question       id, text, category_ids (M2M → Category)
Category       id, name
Answer         person_id, question_id, value (bool), answered_at
PersonPersonSim  person_a_id, person_b_id, similarity, raw_similarity, shared_count, confidence (float)
PersonGroupSim   person_id, group_id, similarity, shared_count, confidence (float)
GroupGroupSim    group_a_id, group_b_id, similarity, per_category_json
GroupCohesivity  group_id, cohesivity, per_category_json
PersonEmbedding  person_id, category_id (nullable), x, y
GroupEmbedding   group_id, category_id (nullable), x, y
```

---

## Proposed Plan (6 phases)

### Phase 1 — Project scaffolding & data model
- Initialize Python project (FastAPI, SQLAlchemy, Alembic)
- Define all models and migrations
- Create seed/sample data scripts for development
- **Deliverable:** runnable API with empty DB, migration system

### Phase 2 — Data ingestion & batch similarity computation
- CSV/JSON import command for people, groups, questions, answers
- Implement the weighted asymmetric similarity metric with Bayesian shrinkage and low-confidence flagging
- Build the batch pre-computation job (NumPy-vectorized)
- Implement Classical MDS embedding computation (numpy only, no sklearn)
- Store all similarity tables + embedding tables (with stress metric)
- **Deliverable:** `compute-similarities` CLI command, all tables populated

### Phase 3 — API endpoints
- `GET /people` (list, filterable by group)
- `GET /people/{id}` (answers + similar/dissimilar persons + group comparisons)
- `GET /groups` (list with aggregate stats)
- `GET /groups/{id}` (cohesivity + similar groups + per-category breakdown)
- `GET /categories`
- `GET /embeddings/people?category=` (MDS coordinates + stress + barycenters)
- `GET /embeddings/groups?category=` (MDS coordinates + stress)
- **Deliverable:** complete REST API

### Phase 4 — Frontend: Similarity Map (landing page)
- React scaffold with MUI, MobX, Recharts, routing
- People scatter plot: MDS 2D with group colors, tooltips, barycenters
- Groups scatter plot: MDS 2D of group-group similarity
- Category filter to switch embeddings
- Stress display + methodology explanation panel
- **Deliverable:** interactive similarity map as landing page

### Phase 5 — Frontend: People & Groups Views
- People table with search/filter by group
- Person detail page:
  - Answer grid (questions × categories)
  - Comparison bars: person vs own group vs other groups
  - Top 5 similar / Top 5 dissimilar persons (with scores)
- Groups table with aggregate yes-rates
- Group detail page:
  - Cohesivity gauge/score
  - Ranked list of other groups by similarity
  - Per-category similarity heatmap
- **Deliverable:** browsable People & Groups Views

### Phase 6 — Polish & deployment
- Category filtering on all views
- Page transitions, loading skeletons, responsive layout
- Methodology panel accessible from map page
- Dockerfile + docker-compose (API + DB)
- Performance tuning (pagination, indexing)
- **Deliverable:** production-ready deployable app
