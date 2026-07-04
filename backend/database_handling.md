# Database Handling

Commands below assume either `backend/` as working directory (development) or `podman exec voting-backend` (production).

## Configuration

The database URL is managed centrally in `app/config.py`. Override with `DATABASE_URL` env var or `.env` / `prod.env` file.

## Migrations

### Generating a migration

When you change a model in `app/models.py`, generate a migration from the `backend/` directory:

```bash
alembic revision --autogenerate -m "description of the change"
```

This compares your models to the live database and writes a migration script in `migrations/versions/`. **Always review the generated script** — autogenerate can miss things (e.g., column renames are detected as add+drop).

### Applying migrations

```bash
# Development (from backend/)
alembic upgrade head

# Production
podman exec voting-backend alembic upgrade head
```

(Migrations also run automatically on application startup via the FastAPI lifecycle hook.)

### Rolling back

```bash
# Development
alembic downgrade -1       # last migration
alembic downgrade base     # all migrations (empty database)

# Production
podman exec voting-backend alembic downgrade base
```

### Inspecting state

```bash
alembic current
alembic history
```

## Resetting the Database

```bash
# Development (from backend/)
alembic downgrade base && alembic upgrade head

# Production
podman exec voting-backend alembic downgrade base \
  && podman exec voting-backend alembic upgrade head
```

### Development (seed data)

```bash
PYTHONPATH=.. python scripts/seed.py
PYTHONPATH=.. python scripts/compute_similarities.py
```

> **Note:** The seed script refuses to run if any data already exists. You must reset the database (downgrade + upgrade) before seeding.

### Production (real data from parliament DB)

The recommended approach is to use `bash deploy.sh` from the project root (see `README.md`), then run the ingestion pipeline:

```bash
# Drop and recreate the target database
podman exec parliament_analysis_postgres psql -U postgres -d postgres \
  -c "DROP DATABASE IF EXISTS voting_similarities WITH (FORCE)"
podman exec parliament_analysis_postgres psql -U postgres -d postgres \
  -c "CREATE DATABASE voting_similarities"

# Ingest from parliament DB → voting_similarities
# (reads from parliament, writes to voting_similarities — parliament is never modified)
podman run --rm --network host \
  -e DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/voting_similarities \
  -e PYTHONPATH=/app \
  -v $(pwd)/backend/scripts/ingest_real_data.py:/app/scripts/ingest_real_data.py:Z \
  localhost/voting-backend \
  python3 /app/scripts/ingest_real_data.py

# Compute similarities + embeddings
podman run --rm --network host \
  --env-file .env.production \
  -e PYTHONPATH=/app \
  localhost/voting-backend \
  python3 /app/scripts/compute_similarities.py
```

> The ingestion script uses `Base.metadata.drop_all` / `create_all` so tables are rebuilt from the current models automatically — no manual migrations needed.

## Computing Similarity Scores

The `compute_similarities.py` script populates the similarity/cohesivity/embedding tables. It must be run after seeding or importing data.

### Default run

```bash
# Development
PYTHONPATH=.. python scripts/compute_similarities.py

# Production
podman exec -e PYTHONPATH=/app voting-backend python /app/scripts/compute_similarities.py
```

Uses default weights: `--w-yes 1.0 --w-no 0.2 --w-mismatch 0.5 --m 10`.

### Custom weights

```bash
python scripts/compute_similarities.py --w-yes 1.0 --w-no 0.5 --w-mismatch 0.3 --m 5
```

### How it works

1. Loads all answers into NumPy matrices (voters × questions)
2. Computes pairwise weighted asymmetric overlap using matrix multiplication
3. Applies Bayesian shrinkage toward the global mean (controlled by `--m`)
4. Computes per-category similarity using only questions in each category
5. Derives group-level metrics by averaging voter-voter similarities
6. Stores results in the similarity tables (clears existing data first)

### Tables populated

| Table | Rows | Description |
|---|---|---|
| `voter_voter_similarity` | ~245K | Pairwise similarity between all voters, with per-category JSON breakdown |
| `voter_group_similarity` | ~8.4K | Voter vs group with per-category JSON breakdown |
| `group_group_similarity` | 66 | Group vs group with per-category JSON breakdown |
| `group_cohesivity` | 12 | Intra-group cohesion with per-category JSON breakdown |
| `voter_embedding` | ~9,100 | MDS 2D coordinates per voter per category (700 × 13) |
| `group_embedding` | ~156 | MDS 2D coordinates per group per category (12 × 13) |

## Current Migration

```
base → 7e3d55803069 (initial_schema)
```

(A single squashed migration containing all 16 tables.)
