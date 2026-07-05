# Voting Similarities — AGENTS.md

## Deployment (podman containers)

Everything runs inside containers — no local dev servers. Use `deploy.sh` to build and start both containers:

```bash
bash deploy.sh
# opens frontend at http://localhost:8080, backend at http://localhost:8000
```

`deploy.sh` reads `.env.production` (falls back to `.env`), builds both images, stops old containers, and starts with host networking. The backend's `data/` directory is volume-mounted for SQLite persistence.

### Data ingestion on a fresh database

Run scripts **inside the container** (or via `conda run` — see below):

```bash
# Seed + compute (inside the running container)
podman exec voting-backend python3 /app/scripts/seed.py
podman exec voting-backend python3 /app/scripts/compute_similarities.py

# Then restart for the new data
podman restart voting-backend
```

## One-shot Python outside containers

If you must run a backend script outside the container (never for the dev server), use the `comparaison_parlementaires` conda environment. **Do not install or modify packages** without explicit approval.

```bash
conda run -n comparaison_parlementaires python backend/scripts/seed.py
conda run -n comparaison_parlementaires python backend/scripts/compute_similarities.py
```

## Commands

| What | How |
|---|---|
| Backend lint | `ruff check backend/` (via conda) |
| Frontend typecheck+build | `npm run build` in `frontend/` |
| Seed DB (refuses if data exists) | `podman exec voting-backend python3 /app/scripts/seed.py` |
| Compute similarities | `podman exec voting-backend python3 /app/scripts/compute_similarities.py` |
| Compute with CLI overrides | `...compute_similarities.py --w-yes 1.0 --w-no 0.2 --w-mismatch 0.5 --m 10` |
| Deploy (podman) | `bash deploy.sh` |
| Rebuild + deploy with no cache | `podman build --no-cache ... && bash deploy.sh` |
| Container logs (backend) | `podman logs voting-backend` |
| Container shell | `podman exec -it voting-backend sh` |

## Architecture

- **Backend**: FastAPI + SQLAlchemy async (`python -m backend` → `backend/__main__.py` → uvicorn)
- **Frontend**: React 19 + MUI 9 + MobX + Recharts, Vite 8. `npm run build` outputs to `build/` (not `dist/`)
- **DB**: SQLite (`data/dev.db`) in dev, PostgreSQL in prod. Both `DATABASE_URL` env var. All similarity data is **precomputed** (no on-the-fly computation at query time).
- **State**: MobX `RootStore` singleton (`frontend/src/stores/root-store.ts`), inits by fetching categories + config.
- **Env**: pydantic-settings reads `.env` from project root.
- **Test**: no test suite exists yet (pytest is a dev dependency but unused).

## Key gotchas

- **All UI labels are in French** (`frontend/src/constants/fr.ts`). Do not add English UI strings.
- **Model was renamed**: `Question`→`Vote` across the entire codebase (DB tables, API endpoints `/questions`→`/votes`, frontend routes, types, stores). The `Answer` model kept its name; only FK `question_id` → `vote_id`.
- **Categories filter**: max 3 categories (`ui-store.ts` line 34). Persisted via localStorage with keys `voting:selectedCategories` and `voting:sortMode`.
- **Seed is safe**: refuses to run if any table has data. Drop tables manually first.
- **Compute is destructive**: deletes and recreates all similarity tables on each run.
- **Similar/dissimilar split**: by sign (≥0 / <0), both shown top 5.
- **MDS stress for degenerate case** (n ≤ n_components): defaults to 1.0 (not 0).
- **Color gradient**: linear red-grey-green in HSV space (`frontend/src/utils/colors.ts`).
- **Frontend API base**: hardcoded in `vite.config.ts` (dev proxy), no runtime env vars.
- **Nginx**: listens on port **8080** (not 80), SPA fallback via `try_files $uri /index.html`.
- **Host networking** in production (podman), no internal DNS.
- **`SIMILARITY_SHRINKAGE_M`** is the env var name (not `_BAYESIAN_` or `_M`). `.env.example` has it correct.
- **Git ignores**: `data/` (whole dir), `**/build`, `.env` files.
- **One-shot Python**: use `conda run -n comparaison_parlementaires` if you must run backend scripts outside a container. Do not install or modify packages without asking.

## Data model

- `Group` → `Voter` (FK group_id), `Vote`, `Answer` (composite PK: voter_id, vote_id)
- Similarity tables: `VoterVoterSim`, `VoterGroupSim`, `GroupGroupSim`, `GroupCohesivity`, `VoterEmbedding`, `GroupEmbedding`, `CategoryDiscriminativeness`, `ComputationMeta`
- Many-to-many `vote_category` table joins `Vote` ↔ `Category`
