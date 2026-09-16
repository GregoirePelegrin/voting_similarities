# Voting Similarities

A web application for analyzing and comparing how voters and groups vote on yes/no questions. Uses a weighted asymmetric similarity metric with additive shrinkage toward the global mean, Classical MDS for 2D visualization, and information gain for explainability.

## Production Startup (podman — single command)

```bash
# Build images and deploy both containers
bash deploy.sh
```

This builds the backend and frontend images, stops any existing containers, and starts new ones using `.env.production` (or `.env` as fallback). After deployment:
- Open **http://localhost:8080** (frontend)
- Backend API at **http://localhost:8000**
- API docs at **http://localhost:8000/docs**

**Note:** Host networking is used so the backend can reach services on the host (e.g. a local PostgreSQL database). The frontend nginx listens on port 8080 instead of 80 (no privileged port binding inside the container).

### Initial data load (fresh database)

On a fresh PostgreSQL database, run the ingestion and computation scripts **from the project root**:

```bash
# 1. Ingest real data from the parliament database
podman run --rm --network host \
  -e DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/voting_similarities \
  -e PYTHONPATH=/app \
  -v $(pwd)/backend/scripts/ingest_real_data.py:/app/scripts/ingest_real_data.py:Z \
  localhost/voting-backend \
  python3 /app/scripts/ingest_real_data.py

# 2. Pre-compute similarities + embeddings
podman run --rm --network host \
  --env-file .env.production \
  -e PYTHONPATH=/app \
  localhost/voting-backend \
  python3 /app/scripts/compute_similarities.py
```

Then restart the backend for the new data: `podman restart voting-backend`.

### Resetting the database and re-importing

```bash
# 1. Drop and recreate the database
podman exec parliament_analysis_postgres psql -U postgres -d postgres \
  -c "DROP DATABASE IF EXISTS voting_similarities WITH (FORCE)"
podman exec parliament_analysis_postgres psql -U postgres -d postgres \
  -c "CREATE DATABASE voting_similarities"

# 2. Re-run ingestion + compute (commands above)
```

> The ingestion script drops and recreates all tables automatically using `Base.metadata.drop_all/create_all`, so no manual migration steps are needed.

### Updating data after a new crawl (local → VPS)

> **Preferred: automated daily update via GitHub Actions** — see the section
> below. The manual procedure here is the fallback / one-time bootstrap.

When new votes are crawled + parsed in `parliament_data_extractor`, push them to the VPS with a **full re-export** — there is no delta path. The ingest script drops and recreates all `voting_similarities` tables, so a full copy is the reliable option and the only real work is shipping the data. Only `members`, `votes`, and `bulletins` are consumed; the crawl cache tables (`raw_pages`/`failed_votes`) stay local.

> **The extractor is now vendored** at `backend/parliament_data_extractor/` and
> shipped inside the backend image, so the daily cron runs crawl/parse directly
> on the VPS — no `scp`/`pg_dump` needed.

**Local (dev machine):**

```bash
# 1. Dump the parliament DB, excluding the crawl cache
podman exec parliament_analysis_postgres pg_dump -U postgres -d fr_assemblee_nationale \
  -T raw_pages -T failed_votes -f /tmp/parl.sql

# 2. Copy to the VPS
scp /tmp/parl.sql root@<VPS_IP>:/root/parl.sql
```

**On the VPS (from `/app/voting_similarities`):**

```bash
# 3. Recreate the parliament DB (name must match PARLIAMENT_DB_URL in step 5)
podman exec parliament_analysis_postgres psql -U postgres -c "DROP DATABASE IF EXISTS fr_assemblee_nationale WITH (FORCE);"
podman exec parliament_analysis_postgres psql -U postgres -c "CREATE DATABASE fr_assemblee_nationale;"

# 4. Restore
podman exec -i parliament_analysis_postgres psql -U postgres -d fr_assemblee_nationale < /root/parl.sql

# 5. Re-ingest (full rebuild — destructive to voting_similarities tables)
podman run --rm --network host \
  --env-file .env.production \
  -e PARLIAMENT_DB_URL="postgresql+asyncpg://postgres:<DB_PASSWORD>@localhost:5432/fr_assemblee_nationale" \
  -e PYTHONPATH=/app \
  -v $(pwd)/backend/scripts/ingest_real_data.py:/app/scripts/ingest_real_data.py:Z \
  localhost/voting-backend \
  python3 /app/scripts/ingest_real_data.py

# 6. Recompute similarities for EVERY config set (Defaut, Bipartisan, Offensif, ...)
#    list them, then run one per set (see batch/update-data.sh for the automated loop)
podman run --rm --network host \
  --env-file .env.production \
  -e PYTHONPATH=/app \
  localhost/voting-backend \
  python3 /app/scripts/compute_similarities.py --name "Defaut"

# 7. Restart so the backend serves cleanly
podman restart voting-backend
```

---

### Automated daily update (GitHub Actions cron)

`.github/workflows/update-data.yml` runs `batch/update-data.sh` on the VPS every
day at **00:00 UTC** (and on `workflow_dispatch`). The script:

1. pulls the repo, then runs the vendored extractor **inside the backend
   container**: `crawl → parse → parse --recategorize` into the
   `fr_assemblee_nationale` database;
2. compares vote/category counts before/after and, **only if something changed**
   (`new_votes` or `recategorized`), re-ingests (`ingest_real_data.py`),
   recomputes similarities for **every** existing config set (via
   `backend/scripts/get_config_sets.py`), and restarts the backend;
3. sends a Telegram postfix message to the shared bot on **every** run
   (success with the count of new votes parsed, or failure with the failing step
   + run link).

Needed on the repo:
- **Secrets**: `TELEGRAM_BOT_KEY`, `TELEGRAM_CHAT_ID` (shared bot, prefix
  `[voting_similarities]` for context), plus the existing deploy secrets
  (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`).
- **Variable**: `LLM_API_KEY` (Groq free tier) — sent only to the SSH session.

Static VPS-side config lives in `batch/.env.data` (copy of
`batch/.env.data.example`, git-ignored): PostgreSQL creds for the extractor DB
(`DB_FR_ASSEMBLEE_NATIONALE_NAME`) and LLM defaults.

### Manual rebuild (without deploy.sh)

```bash
podman build -t voting-backend:latest -f backend/Dockerfile .
podman build -t voting-frontend:latest -f frontend/Dockerfile .

podman rm -f voting-backend voting-frontend 2>/dev/null

podman run -d --name voting-backend --network host --env-file .env.production voting-backend:latest
podman run -d --name voting-frontend --network host voting-frontend:latest
```

---

## Development Setup

### Prerequisites

- **Python 3.11+** (with pip)
- **Node.js 18+** (with npm)
- **Git**

### 1. Clone the repository

```bash
git clone <repo-url>
cd voting_similarities
```

### 2. Backend

#### Install dependencies

```bash
pip install -e .
# or using pyproject.toml directly:
pip install -e ".[dev]"
```

#### Configure

```bash
cp .env.example .env
```

Key variables (see [Configuration](#configuration) for the full list):

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///data/dev.db` | Database connection string |
| `API_PORT` | `8000` | Backend server port |
| `RELOAD` | `True` | Auto-reload on code changes (disable in production) |

#### Initialize the database

```bash
PYTHONPATH=backend python backend/scripts/seed.py
PYTHONPATH=backend python backend/scripts/compute_similarities.py
```

#### Start the server

```bash
python -m backend
```

The API is available at http://localhost:8000. Swagger docs at http://localhost:8000/docs.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at http://localhost:5173 and proxies API calls to `http://localhost:8000` by default (configured in `vite.config.ts`).

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/categories` | List all categories |
| GET | `/categories/discriminativeness` | All categories ranked by discriminative power |
| GET | `/questions` | List all questions with their categories and has_passed |
| GET | `/questions/{id}` | Question detail with per-group answer stats |
| GET | `/voters?page=&page_size=&group_id=` | Paginated voters list |
| GET | `/voters/{id}?category=` | Voter detail with similar/dissimilar voters, group comparisons |
| GET | `/voters/{id}/category-alignment` | Per-category alignment of a voter with their group vs others |
| GET | `/groups` | List all groups with cohesivity |
| GET | `/groups/{id}?category=` | Group detail with cohesivity, similar groups, per-category |
| GET | `/groups/{id}/determinant-categories` | Categories ranked by information gain for this group |
| GET | `/embeddings/voters?category=` | MDS 2D coordinates + barycenters for voters |
| GET | `/embeddings/groups?category=` | MDS 2D coordinates for groups |
| GET | `/config` | Similarity metric configuration parameters |
| GET | `/metrics?days=7` | Visit metrics: total, daily average, per-day and per-endpoint breakdown (needs `METRICS_API_KEY` if set) |

---

## Configuration

### Backend (`.env` / `prod.env` or environment variables)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///data/dev.db` | Database connection string |
| `API_PORT` | `8000` | Port for the uvicorn server |
| `API_HOST` | `0.0.0.0` | Host for the uvicorn server |
| `RELOAD` | `True` | Enable uvicorn auto-reload (disable in production) |
| `UVICORN_WORKERS` | `4` | Number of uvicorn worker processes |
| `CORS_ORIGINS` | `["*"]` | Allowed CORS origins (JSON list) |
| `DB_ECHO` | `False` | Echo SQL statements to logs |
| `DB_POOL_SIZE` | `5` | SQLAlchemy connection pool size (PostgreSQL only) |
| `LOG_LEVEL` | `INFO` | Python logging level (DEBUG, INFO, WARNING, ERROR) |
| `SIMILARITY_W_YES` | `1.0` | Weight for Yes-Yes agreement |
| `SIMILARITY_W_NO` | `0.2` | Weight for No-No agreement |
| `SIMILARITY_W_MISMATCH` | `0.5` | Penalty for disagreement |
| `SIMILARITY_SHRINKAGE_M` | `10` | Shrinkage strength (shared votes before pair score dominates global mean) |
| `METRICS_API_KEY` | *(empty)* | Optional Bearer key protecting `GET /api/metrics` |

### Frontend

The frontend is a Vite + React SPA with no runtime environment variables. The API base URL is hardcoded in `vite.config.ts` (default: `http://localhost:8000`).

---

## Project Structure

```
├── .env.example           # Template for dev environment variables
├── prod.env               # Production environment variables
├── deploy.sh              # Container build + deploy script
├── .gitignore
├── pyproject.toml         # Python project config + ruff settings
├── batch/
│   ├── update-data.sh     # Daily cron pipeline (crawl → parse → conditional ingest/compute)
│   └── .env.data.example  # Static extractor config for update-data.sh (DB + LLM envs)
├── backend/
│   ├── Dockerfile         # Multi-stage Python 3.12-slim image (bundles vendored extractor)
│   ├── alembic.ini        # Alembic migration config
│   ├── parliament_data_extractor/  # Vendored extractor package (crawl/parse/analyze)
│   ├── app/
│   │   ├── main.py        # FastAPI app + lifecycle hooks
│   │   ├── config.py      # pydantic-settings configuration
│   │   ├── database.py    # SQLAlchemy engine + session
│   │   ├── models.py      # All SQLAlchemy models
│   │   ├── schemas.py     # Pydantic response schemas
│   │   ├── similarity.py  # Similarity metric + batch computation
│   │   ├── embedding.py   # Classical MDS implementation
│   │   └── api/
│   │       ├── health.py  # /health endpoint
│   │       └── routes.py  # All API endpoints
│   ├── scripts/
│   │   ├── seed.py               # Generate sample data (safe: refuses if data exists)
│   │   ├── ingest_real_data.py   # Ingest from the parliament DB (PARLIAMENT_DB_URL)
│   │   ├── get_config_sets.py    # List config sets as TSV (used by update-data.sh)
│   │   └── compute_similarities.py # Batch computation + schema auto-creation
│   ├── migrations/        # Alembic migration files
│   └── database_handling.md  # Detailed DB operations guide
└── frontend/
    ├── Dockerfile         # Multi-stage Node 22 + nginx image
    ├── nginx.conf         # Nginx config (port 8080, SPA fallback)
    ├── package.json
    ├── vite.config.ts     # Vite config + dev API proxy
    └── src/
        ├── app.tsx        # Root component + routing
        ├── api/           # API client functions + types
        ├── stores/        # MobX state stores
        ├── pages/         # Route pages
        ├── components/    # Reusable UI components
        ├── constants/     # French locale strings
        └── utils/         # Color utilities, helpers
```

---

## Linting

```bash
# Backend
ruff check backend/

# Frontend (build = typecheck + bundle)
cd frontend && npm run build
```

---

## Key Concepts

### Similarity Metric

A weighted asymmetric overlap where Yes-Yes agreement counts more than No-No agreement:

- **Yes-Yes**: weight 1.0 (strong signal of shared conviction)
- **No-No**: weight 0.2 (weaker signal)
- **Disagreement**: penalty -0.5

Additive shrinkage blends each pair's raw score with the global mean, weighted by shared question count (parameter `m=10`), to handle sparse voting records.

### MDS Visualization

Classical Multidimensional Scaling projects the similarity matrix into 2D. Unlike PCA, it works directly on the similarity matrix and faithfully reflects the custom weighting scheme.

### Explainability

- **Information gain**: measures how much knowing answers in a category reduces uncertainty about group membership
- **Category alignment**: for a given voter, how well each category aligns them with their own group versus other groups
- **Precision (accuracy)**: for a given group, the rate at which a category correctly predicts group membership
- **KL divergence**: measures how much a group's vote distribution differs from the overall average, per category
- **Variance score**: how much a category polarizes groups (descriptive complement to IG)
