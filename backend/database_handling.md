# Database Handling

All commands below assume you are in the `backend/` directory.

## Configuration

The database URL is managed centrally in `app/config.py`. By default it points to `data/dev.db` at the project root. You can override it by setting the `DATABASE_URL` environment variable or creating a `.env` file in `backend/`:

```
DATABASE_URL=sqlite+aiosqlite:///../data/dev.db
```

## Initial Setup

### From scratch (no data)

```bash
# Run all pending migrations to create the tables
alembic upgrade head
```

### From scratch (with sample data)

```bash
# The seed script resets the database through Alembic migrations and fills it with sample data
# WARNING: this destroys any existing data
python scripts/seed.py
```

## Migrations

### Generating a migration

When you change a model in `app/models.py` (add a column, new table, etc.), generate a migration:

```bash
alembic revision --autogenerate -m "description of the change"
```

This compares your models to the live database and writes a migration script in `migrations/versions/`. **Always review the generated script** — autogenerate can miss things (e.g., column renames are detected as add+drop).

### Applying migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply only the next migration
alembic upgrade +1
```

### Rolling back

```bash
# Roll back the last migration
alembic downgrade -1

# Roll back to a specific revision
alembic downgrade <revision_id>

# Roll back all migrations (empty database)
alembic downgrade base
```

### Inspecting state

```bash
# Show current revision
alembic current

# Show migration history
alembic history
```

## Typical Workflow: Adding a New Feature

For example, adding a new similarity computation method that requires a new column:

1. Edit `app/models.py` — add the column to the relevant model
2. Generate the migration:
   ```bash
   alembic revision --autogenerate -m "add new_sim_method to person_person_similarity"
   ```
3. Review the generated script in `migrations/versions/`
4. Apply it:
   ```bash
   alembic upgrade head
   ```
5. Implement the computation logic and re-run the batch job to populate the new column

## Resetting the Database

```bash
# Option A: Roll back everything and re-apply migrations (preserves migration history)
alembic downgrade base
alembic upgrade head

# Option B: Re-seed with sample data (destroys everything, uses Alembic internally)
python scripts/seed.py
```

## Computing Similarity Scores

The `compute_similarities.py` script populates all four similarity/cohesivity tables. It should be run after seeding or importing data.

### Default run

```bash
PYTHONPATH=. python scripts/compute_similarities.py
```

This uses the default weights from PROJECT.md:
- `--w-yes 1.0` (weight for Yes-Yes agreement)
- `--w-no 0.2` (weight for No-No agreement)
- `--w-mismatch 0.5` (penalty for disagreement)
- `--m 10` (Bayesian shrinkage parameter)

### Custom weights

```bash
PYTHONPATH=. python scripts/compute_similarities.py --w-yes 1.0 --w-no 0.5 --w-mismatch 0.3 --m 5
```

### How it works

1. Loads all answers into NumPy matrices (people × questions)
2. Computes pairwise weighted asymmetric overlap using matrix multiplication
3. Applies Bayesian shrinkage toward the global mean (controlled by `--m`)
4. Computes per-category similarity using only questions in each category
5. Derives group-level metrics by averaging person-person similarities
6. Stores all results in the four similarity tables (clears existing data first)

### Tables populated

| Table | Rows | Description |
|---|---|---|
| `person_person_similarity` | ~245K | Pairwise similarity between all people, with per-category JSON breakdown |
| `person_group_similarity` | ~8.4K | Person vs group with per-category JSON breakdown |
| `group_group_similarity` | 66 | Group vs group with per-category JSON breakdown |
| `group_cohesivity` | 12 | Intra-group cohesion with per-category JSON breakdown |

## Current Migration Chain

```
base → c74e546ec80d (initial schema)
     → 98847eb27900 (add per_category to person_person_similarity)
     → 1d9941e43959 (add description to questions)
     → e41a6efd589b (add per_category to person_group_similarity)
```
