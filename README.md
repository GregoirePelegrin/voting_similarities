# Voting Similarities

A web application for analyzing and comparing how voters and groups vote on yes/no questions. Uses a weighted asymmetric similarity metric with Bayesian shrinkage, Classical MDS for 2D visualization, and information gain for explainability.

## Production Startup (podman + PostgreSQL)

```bash
# Prerequisites: a running PostgreSQL container with the `voting_similarities` database
# e.g.: podman run -d --name postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 postgres:16

# 1. Build images
podman build -t voting-backend:latest --build-arg PIP_TRUSTED_HOST=127.0.0.1 -f backend/Dockerfile .
podman build -t voting-frontend:latest --build-arg NPM_CONFIG_PROXY=http://127.0.0.1:3128 -f frontend/Dockerfile .

# 2. Start backend (uses host networking to reach local PostgreSQL)
podman run -d --name voting-backend --network host \
  --env-file prod.env \
  voting-backend:latest

# 3. Run database migrations (runs automatically on startup, or manually:)
podman exec voting-backend alembic upgrade head

# 4. Seed and compute similarities (only on fresh database)
podman exec -e PYTHONPATH=/app voting-backend python /app/scripts/seed.py
podman exec -e PYTHONPATH=/app voting-backend python /app/scripts/compute_similarities.py

# 5. Start frontend
podman run -d --name voting-frontend -p 8080:80 voting-frontend:latest
```

Then open http://localhost:8080 in your browser. The backend API runs on http://localhost:8000.

### Resetting the database

```bash
podman exec voting-backend alembic downgrade base
podman exec voting-backend alembic upgrade head
podman exec -e PYTHONPATH=/app voting-backend python /app/scripts/seed.py
podman exec -e PYTHONPATH=/app voting-backend python /app/scripts/compute_similarities.py
```

---

## Development Setup

### Prerequisites

- **Python 3.11+** (with pip or conda)
- **Node.js 16+** (with npm)
- **Git**

### 1. Clone the repository

```bash
git clone <repo-url>
cd voting_similarities
```

### 2. Backend

#### Install dependencies

```bash
pip install fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" aiosqlite asyncpg alembic numpy pydantic pydantic-settings

# Dev dependencies (optional, for linting)
pip install ruff pytest pytest-asyncio httpx
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
npm start
```

The app opens at http://localhost:3000 and proxies API calls to `http://localhost:8000` by default.

To point to a different backend:

```bash
REACT_APP_API_URL=http://my-server:8000 npm start
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/categories` | List all categories |
| GET | `/questions` | List all questions with their categories and has_passed |
| GET | `/questions/{id}` | Question detail with per-group answer stats |
| GET | `/voters?page=&page_size=&group_id=` | Paginated voters list |
| GET | `/voters/{id}?category=` | Voter detail with similar/dissimilar voters, group comparisons |
| GET | `/voters/{id}/category-alignment` | Per-category alignment of a voter with their group vs others |
| GET | `/groups` | List all groups with cohesivity |
| GET | `/groups/{id}?category=` | Group detail with cohesivity, similar groups, per-category |
| GET | `/groups/{id}/determinant-categories` | Categories ranked by information gain for this group |
| GET | `/categories/discriminativeness` | All categories ranked by discriminative power |
| GET | `/embeddings/voters?category=` | MDS 2D coordinates + barycenters for voters |
| GET | `/embeddings/groups?category=` | MDS 2D coordinates for groups |

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
| `SIMILARITY_BAYESIAN_M` | `10` | Bayesian shrinkage strength |

### Frontend (environment variables)

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8000` | Backend API base URL (set at build time) |

---

## Project Structure

```
├── .env.example          # Template for dev environment variables
├── prod.env              # Production environment variables
├── .gitignore
├── pyproject.toml        # Python project config + ruff settings
├── backend/
│   ├── Dockerfile        # Multi-stage Python 3.12-slim image
│   ├── alembic.ini       # Alembic migration config
│   ├── app/
│   │   ├── main.py       # FastAPI app + lifecycle hooks
│   │   ├── config.py     # pydantic-settings configuration
│   │   ├── database.py   # SQLAlchemy engine + session
│   │   ├── models.py     # All SQLAlchemy models
│   │   ├── schemas.py    # Pydantic response schemas
│   │   ├── similarity.py # Similarity metric + batch computation
│   │   ├── embedding.py  # Classical MDS implementation
│   │   └── api/
│   │       ├── health.py # /health endpoint
│   │       └── routes.py # All API endpoints
│   ├── scripts/
│   │   ├── seed.py               # Generate sample data (safe: refuses if data exists)
│   │   └── compute_similarities.py # Batch computation job
│   ├── migrations/       # Alembic migration files
│   └── database_handling.md  # Detailed DB operations guide
└── frontend/
    ├── Dockerfile        # Multi-stage Node 20 + nginx image
    ├── nginx.conf        # Nginx config with SPA fallback
    ├── package.json
    └── src/
        ├── app.tsx        # Root component + routing
        ├── api/           # API client functions + types
        ├── stores/        # MobX state stores
        ├── pages/         # Route pages
        └── components/    # Reusable UI components
```

---

## Linting

```bash
# Backend
ruff check backend/

# Frontend
cd frontend && CI=true npm run build
```

---

## Key Concepts

### Similarity Metric

A weighted asymmetric overlap where Yes-Yes agreement counts more than No-No agreement:

- **Yes-Yes**: weight 1.0 (strong signal of shared conviction)
- **No-No**: weight 0.2 (weaker signal)
- **Disagreement**: penalty -0.5

Bayesian shrinkage blends each pair's raw score with the global mean, weighted by shared question count (parameter `m=10`), to handle sparse voting records.

### MDS Visualization

Classical Multidimensional Scaling projects the similarity matrix into 2D. Unlike PCA, it works directly on the similarity matrix and faithfully reflects the custom weighting scheme.

### Explainability

- **Information gain**: measures how much knowing answers in a category reduces uncertainty about group membership
- **Category alignment**: for a given voter, how well each category aligns them with their own group versus other groups
- **Variance score**: how much a category polarizes groups (descriptive complement to IG)
