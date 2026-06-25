# Groups Comparison

A web application for analyzing and comparing how individuals and groups vote on yes/no questions. Uses a weighted asymmetric similarity metric with Bayesian shrinkage, Classical MDS for 2D visualization, and information gain for explainability.

## Quick Start

```bash
# 1. Backend setup
conda activate base                           # or any Python 3.11+ environment
pip install fastapi uvicorn[standard] sqlalchemy[asyncio] aiosqlite alembic numpy pydantic pydantic-settings
cp .env.example .env                          # customize if needed

# 2. Initialize the database with sample data
python backend/scripts/seed.py

# 3. Compute similarities, embeddings, and category discriminativeness
python backend/scripts/compute_similarities.py

# 4. Start the backend
python -m backend

# 5. Frontend setup (in another terminal)
cd frontend
npm install
npm start
```

Then open http://localhost:3000 in your browser. The backend API runs on http://localhost:8000 by default.

---

## Detailed Setup

### Prerequisites

- **Python 3.11+** (with pip or conda)
- **Node.js 16+** (with npm)
- **Git**

### 1. Clone the repository

```bash
git clone <repo-url>
cd groups-comparison
```

### 2. Backend

#### Install dependencies

```bash
# Using conda
conda activate base
pip install fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" aiosqlite asyncpg alembic numpy pydantic pydantic-settings

# Dev dependencies (optional, for linting)
pip install ruff pytest pytest-asyncio httpx
```

#### Configure

Copy the example environment file and customize if needed:

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

The seed script creates the schema (via Alembic migrations) and populates it with realistic sample data (~12 groups, ~12 categories, ~100 questions, ~700 people):

```bash
python backend/scripts/seed.py
```

This creates `data/dev.db` in the project root.

#### Compute similarities and embeddings

The batch job computes all pairwise similarities (person-person, person-group, group-group), group cohesivity, MDS embeddings, and category discriminativeness:

```bash
python backend/scripts/compute_similarities.py
```

This takes a few seconds for the sample data. With the full dataset (~7500 questions, ~700 people) it may take several minutes.

Optional flags to override similarity metric parameters:

```bash
python backend/scripts/compute_similarities.py --w-yes 1.0 --w-no 0.2 --w-mismatch 0.5 --m 10
```

#### Start the server

```bash
python -m backend
```

The API is available at http://localhost:8000. Swagger docs at http://localhost:8000/docs.

You can customize the port and host:

```bash
API_PORT=3001 API_HOST=127.0.0.1 python -m backend
```

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

## Using with a Populated Database

If you already have a `data/dev.db` (or any populated SQLite/PostgreSQL database):

1. Set `DATABASE_URL` in `.env` to point to your database
2. Run migrations if needed: `cd backend && alembic upgrade head`
3. Compute similarities: `python backend/scripts/compute_similarities.py`
4. Start the backend and frontend as above

The database must contain data in the following tables: `groups`, `categories`, `questions`, `people`, `answers`, and the `question_category` association table. The seed script is only for generating sample data — in production you would populate these tables from your own data source.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/categories` | List all categories |
| GET | `/questions` | List all questions with their categories and has_passed |
| GET | `/questions/{id}` | Question detail with per-group answer stats |
| GET | `/people?page=&page_size=&group_id=` | Paginated people list |
| GET | `/people/{id}?category=` | Person detail with similar/dissimilar people, group comparisons |
| GET | `/people/{id}/category-alignment` | Per-category alignment of a person with their group vs others |
| GET | `/groups` | List all groups with cohesivity |
| GET | `/groups/{id}?category=` | Group detail with cohesivity, similar groups, per-category breakdown |
| GET | `/groups/{id}/determinant-categories` | Categories ranked by information gain for this group |
| GET | `/categories/discriminativeness` | All categories ranked by discriminative power |
| GET | `/embeddings/people?category=` | MDS 2D coordinates + barycenters for people |
| GET | `/embeddings/groups?category=` | MDS 2D coordinates for groups |

---

## Configuration

### Backend (`.env` or environment variables)

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
| `SIMILARITY_W_YES` | `1.0` | Weight for Yes-Yes agreement |
| `SIMILARITY_W_NO` | `0.2` | Weight for No-No agreement |
| `SIMILARITY_W_MISMATCH` | `0.5` | Penalty for disagreement |
| `SIMILARITY_BAYESIAN_M` | `10` | Bayesian shrinkage strength |

### Frontend (environment variables)

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## Project Structure

```
├── .env.example          # Template for environment variables
├── .env                  # Local config (gitignored)
├── .gitignore
├── PROJECT.md            # Detailed technical documentation
├── pyproject.toml        # Python project config + ruff settings
├── data/
│   └── dev.db            # SQLite database (gitignored)
├── backend/
│   ├── __main__.py       # Entry point: python -m backend
│   ├── alembic.ini       # Alembic migration config
│   ├── app/
│   │   ├── main.py       # FastAPI app + CORS + logging
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
│   │   ├── seed.py               # Generate sample data
│   │   └── compute_similarities.py # Batch computation job
│   └── migrations/       # Alembic migration files
└── frontend/
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

# Frontend (built into react-scripts)
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
- **Category alignment**: for a given person, how well each category aligns them with their own group versus other groups
- **Variance score**: how much a category polarizes groups (descriptive complement to IG)
