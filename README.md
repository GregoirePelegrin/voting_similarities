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
├── backend/
│   ├── Dockerfile         # Multi-stage Python 3.12-slim image
│   ├── alembic.ini        # Alembic migration config
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
