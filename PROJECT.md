# Voting Similarities — Project Description & Plan

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
- Table/list of all people with group, role, commission, circonscription columns
- Click on a person → detail page showing:
  - Collapsible info card (role, commission, circonscription)
  - Answer rate gauge (personal) and group average answer rate gauge, displayed beside the info card
  - Answer grid: colored squares in a grid layout (5-color scheme: grey=no answer, green=yes same as group, blue=yes different from group, red=no same as group, purple=no different from group), showing answer count / total questions
  - Hoverable squares showing question text + outcome; clickable → question detail
  - Comparison to every other group's aggregate votes (with info tooltip)
  - Top 5 most similar persons (with similarity score)
  - Top 5 most dissimilar persons (with similarity score, negative values shown in red)
  - Category alignment card (horizontal bar chart, percentage scale, positive=green/negative=red)

**3. Groups View**
- Table of all groups with aggregate answer rates per question
- Click on a group → detail page showing:
  - Cohesivity score (how internally similar the members are)
  - Answer rate gauge (average of member answer rates)
  - All other groups ranked by similarity
  - Per-category breakdown of similarity
  - Determinant categories: which categories best predict this group's identity (information gain)

**4. Explainability**
- Per-category information gain: measures how much knowing answers in a category reduces uncertainty about group membership
- Per-group breakdown: for each category, classification accuracy and most-confused-with group
- Per-person category alignment: how well each category aligns a person with their own group vs. others

**5. Questions View**
- Table of all questions with ID, text, has_passed status, and categories
- Click on a question → detail page showing:
  - Question text, description, passed/not passed badge, categories
  - Total yes/no/missing counts
  - Per-group breakdown: yes rate, yes/no/missing counts, colored bar

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

### Handling sparse voting records (additive shrinkage + threshold)

Some people may have answered very few questions, leading to unreliable similarity scores when their overlap with another person is small. We address this with a two-part strategy:

**1. Shrinkage toward the global mean (additive smoothing)**

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

Group-level similarity is computed by averaging member similarity scores (or using group centroid vectors with the same weighting). Group-group and person-group similarity also apply the same shrinkage when the effective overlap is low.

---

## Explainability: Category Discriminativeness

### Information gain (primary metric)

For each category, we measure how well it predicts group membership using **mutual information** (information gain):

1. For each person, find the group they are most similar to in that category (using per-category PersonGroupSim data)
2. Build a contingency table: `actual_group × predicted_group_from_category`
3. Compute mutual information I(Group; PredictedGroup | category)
4. Normalize by H(Group) to get a fraction: "what % of group uncertainty does this category resolve?"

### Per-group breakdown

For each group in each category:
- **Accuracy**: fraction of members correctly predicted to belong to their group
- **Most confused with**: the group most commonly mis-assigned to this group's members
- **KL divergence**: how the predicted-group distribution for this group's members differs from the overall prediction distribution

### Variance-based discriminativeness (supplementary)

From GroupGroupSim.per_category: for each category, compute the variance of inter-group similarities. High variance = some groups are very similar, some very different = more discriminative. This complements IG by showing descriptive polarization alongside predictive power.

### Per-person category alignment

For a given person p in group g, per-category alignment is:
```
alignment_c = similarity_to_own_group_c - mean(similarity_to_other_groups_c)
```
Positive = this category makes the person fit their group. Negative = this category makes them unusual. Computed on-the-fly from existing PersonGroupSim.per_category data — no additional batch computation needed.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (React + MUI + MobX + Recharts)   │
│  - Similarity map (MDS scatter plots)       │
│  - People table / detail views              │
│  - Groups table / detail views              │
│  - Category filtering                       │
│  - Similarity bar charts / heatmaps         │
│  - Answer rate gauges                        │
│  - Category alignment charts                 │
│  - Error dialog on API unavailability       │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│  Backend (FastAPI + SQLAlchemy)              │
│  - /health                                   │
│  - /categories, /questions, /questions/{id}  │
│  - /categories/discriminativeness            │
│  - /groups/{id}/determinant-categories       │
│  - /people/{id}/category-alignment           │
│  - /people, /people/{id} (answer_rate, group_avg_answer_rate)   │
│  - /groups, /groups/{id} (answer_rate)                          │
│  - /embeddings/people, /embeddings/groups    │
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
│  - category_discriminativeness (pre-computed)│
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
| `category_discriminativeness` | **12** | Information gain + variance per category |

All computed via a **batch job** (CLI command) that:
1. Loads all answers into a sparse matrix (people × questions)
2. Computes pairwise similarity using vectorized NumPy operations
3. Stores results in the database
4. Can be re-run whenever new answers are ingested

---

## Data Model

```
Group          id, name, color
Role           id, name
Commission     id, name
Person         id, firstname, lastname, group_id (FK → Group), role_id (FK → Role, nullable), commission_id (FK → Commission, nullable), circonscription (nullable)
Question       id, text, description (nullable), has_passed (bool), category_ids (M2M → Category)
Category       id, name
Answer         person_id, question_id, value (bool), answered_at
PersonPersonSim  person_a_id, person_b_id, similarity, raw_similarity, shared_count, confidence, per_category (JSON)
PersonGroupSim   person_id, group_id, similarity, shared_count, confidence, per_category (JSON)
GroupGroupSim    group_a_id, group_b_id, similarity, per_category (JSON)
GroupCohesivity  group_id, cohesivity, per_category (JSON)
PersonEmbedding  person_id, category_id (nullable), x, y, stress
GroupEmbedding   group_id, category_id (nullable), x, y, stress
CategoryDiscriminativeness  category_id, info_gain, normalized_ig, variance_score, per_group_breakdown (JSON)
```

### Computed API fields (on-the-fly, not stored)

| Field | Endpoint | Description |
|---|---|---|
| `answer_rate` | `/people/{id}`, `/groups/{id}` | Fraction of questions answered (person), or average of members' answer rates (group) |
| `group_avg_answer_rate` | `/people/{id}` | Average answer rate across all members of the person's group |

---

## Configuration

The backend uses `pydantic-settings` and reads from environment variables or a `.env` file in the project root. Copy `.env.example` to `.env` and customize as needed:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///data/dev.db` | Database connection string |
| `API_PORT` | `8000` | Port for the uvicorn server |
| `API_HOST` | `0.0.0.0` | Host for the uvicorn server |
| `RELOAD` | `True` | Enable uvicorn auto-reload (disable in production) |
| `CORS_ORIGINS` | `["*"]` | Allowed CORS origins (JSON list) |
| `DB_ECHO` | `False` | Echo SQL statements to logs |
| `DB_POOL_SIZE` | `5` | SQLAlchemy connection pool size (PostgreSQL only) |
| `LOG_LEVEL` | `INFO` | Python logging level (DEBUG, INFO, WARNING, ERROR) |
| `SIMILARITY_W_YES` | `1.0` | Weight for Yes-Yes agreement in similarity metric |
| `SIMILARITY_W_NO` | `0.2` | Weight for No-No agreement in similarity metric |
| `SIMILARITY_W_MISMATCH` | `0.5` | Penalty for disagreement in similarity metric |
| `SIMILARITY_SHRINKAGE_M` | `10` | Shrinkage strength (shared questions needed to trust pair score over global mean) |

The similarity parameters (`SIMILARITY_*`) serve as defaults for the batch computation CLI, which also accepts `--w-yes`, `--w-no`, `--w-mismatch`, and `--m` as command-line overrides.

The frontend reads:
| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## Proposed Plan (6 phases)

### Phase 1 — Project scaffolding & data model
- Initialize Python project (FastAPI, SQLAlchemy, Alembic)
- Define all models and migrations
- Create seed/sample data scripts for development
- **Deliverable:** runnable API with empty DB, migration system

### Phase 2 — Data ingestion & batch similarity computation
- CSV/JSON import command for people, groups, questions, answers
- Implement the weighted asymmetric similarity metric with additive shrinkage and low-confidence flagging
- Build the batch pre-computation job (NumPy-vectorized)
- Implement Classical MDS embedding computation (numpy only, no sklearn)
- Store all similarity tables + embedding tables (with stress metric)
- **Deliverable:** `compute-similarities` CLI command, all tables populated

### Phase 3 — API endpoints
- `GET /health`
- `GET /people` (list, filterable by group)
- `GET /people/{id}` (answers + similar/dissimilar persons + group comparisons)
- `GET /groups` (list with aggregate stats)
- `GET /groups/{id}` (cohesivity + similar groups + per-category breakdown)
- `GET /categories`
- `GET /questions`
- `GET /categories/discriminativeness`
- `GET /embeddings/people?category=` (MDS coordinates + stress + barycenters)
- `GET /embeddings/groups?category=` (MDS coordinates + stress)
- `GET /groups/{id}/determinant-categories`
- `GET /people/{id}/category-alignment`
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
  - Determinant categories card (information gain + accuracy + confusion)
- Person detail page:
  - Category alignment card (per-category alignment with own group vs others)
- **Deliverable:** browsable People & Groups Views

### Phase 6 — Polish & deployment
- Category filtering on all views
- Page transitions, loading skeletons, responsive layout
- Methodology panel accessible from map page
- Error dialog for API unavailability (with retry/dismiss)
- Dockerfile + docker-compose (API + DB)
- Performance tuning (pagination, indexing)
- **Deliverable:** production-ready deployable app
