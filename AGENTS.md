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

#### Mise à jour de la base de données après un changement de schéma

Si vous modifiez un modèle (ajout d'une colonne, etc.), vous devez supprimer les tables concernées et les laisser se recréer via `create_all`. Exemple pour les tables de similarité :

```bash
podman exec parliament_analysis_postgres psql -U postgres -d voting_similarities -c "
DROP TABLE IF EXISTS voter_voter_similarity CASCADE;
DROP TABLE IF EXISTS voter_group_similarity CASCADE;
DROP TABLE IF EXISTS group_group_similarity CASCADE;
DROP TABLE IF EXISTS group_cohesivity CASCADE;
DROP TABLE IF EXISTS voter_embedding CASCADE;
DROP TABLE IF EXISTS group_embedding CASCADE;
DROP TABLE IF EXISTS category_discriminativeness CASCADE;
DROP TABLE IF EXISTS computation_meta CASCADE;
"
```

Ensuite, redémarrez l'API (`podman restart voting-backend`) et relancez le calcul des similarités.

## One-shot Python outside containers

If you must run a backend script outside the container (never for the dev server), use the `comparaison_parlementaires` conda environment. **Do not install or modify packages** without explicit approval.

```bash
conda run -n comparaison_parlementaires python backend/scripts/seed.py
conda run -n comparaison_parlementaires python backend/scripts/compute_similarities.py
```

## Commands

| What | How |
|---|---|---|
| Backend lint | `ruff check backend/` (via conda) |
| Full deploy (frontend + backend) | `bash deploy.sh` — this is the **only** way to build and run anything. Do NOT run `npm run build`, `uvicorn`, or any other dev command on the host. |
| Seed DB (refuses if data exists) | `podman exec voting-backend python3 /app/scripts/seed.py` |
| Compute similarities | `podman exec voting-backend python3 /app/scripts/compute_similarities.py --name "Defaut"` |
| Compute with CLI overrides | `...compute_similarities.py --name "Offensif" --w-yes 1.0 --w-no 0.0 --w-mismatch 1.0 --m 5` |
| Compute multiple sets | Run with different `--name` values; each creates a coexisting config set |
| Deploy (podman) | `bash deploy.sh` |
| Rebuild + deploy with no cache | `podman build --no-cache ... && bash deploy.sh` |
| Container logs (backend) | `podman logs voting-backend` |
| Container shell | `podman exec -it voting-backend sh` |

## Daily data update (cron)

`.github/workflows/update-data.yml` runs `batch/update-data.sh` on the VPS every day at **00:00 UTC** (or via `workflow_dispatch`). The script uses the **vendored** `parliament_data_extractor` (shipped inside the backend image at `/app/parliament_data_extractor`, importable as `python3 -m parliament_data_extractor.scripts.<cmd>` — it is NOT a git clone of the other repo).

Pipeline inside `update-data.sh`:

1. `git` pull → **LLM preflight** → count votes/categories in `fr_assemblee_nationale` (via `podman exec parliament_analysis_postgres psql -U postgres ...`) → `crawl`.
   The preflight does a `GET $LLM_BASE_URL/models` with the bearer token and **hard-fails** (dedicated Telegram alert, `exit 1`) when the key is missing or not 200. This must stay **before** `crawl`: `process_raw_page` swallows `categorize_title` errors and stores `categories = []`, so an invalid key would otherwise silently ingest uncategorised votes and poison `category_discriminativeness` + every per-category table.
2. **Reconcile** (right after `crawl`): mark `raw_pages` rows as processed when a vote already exists for their scrutins (`UPDATE raw_pages rp SET processed = TRUE FROM votes v WHERE v.scrutin_id = rp.scrutin_id AND NOT rp.processed`) — idempotent, clears legacy/backlog flags so `parse` never re-processes the historical cache (which adds LLM cost and memory pressure).
3. **Fast path**: re-count votes + unprocessed `raw_pages` + `max(scrutin_id)` of `raw_pages` (captured before/after `crawl`); if nothing new crawled (`raw_max` unchanged), nothing is pending (`unprocessed == 0`) **and the two DBs have not drifted**, send "aucun nouveau vote" and stop **before** `parse`/`recategorize`. Drift = parliament `votes` count ≠ app `votes` count, the latter read with `ingest_real_data.py --count-votes` (prints 0 on any failure, so an unreadable app DB reads as drift and forces a re-ingest). Without this check a failed ingest is masked forever by "aucun nouveau vote".
4. Otherwise: `parse` → `parse --recategorize` → count again; **if nothing changed** (`new_votes`/`regategorized` both 0) **and no drift**, send "aucun nouveau vote" and stop. Else: `ingest_real_data.py` (`PARLIAMENT_DB_URL` built from `batch/.env.data`), recompute similarities for **every** config set (TSV list from `get_config_sets.py`, default set `Defaut 1.0 0.2 0.5 10` if none), restart backend, wait for `/api/health`.
5. Telegram notifications **every** run: success with new-vote counts, or failure with failing step + last log lines + memory + `RUN_URL`. The LLM preflight sends its own actionable alert instead of relying on the generic `on_error` tail (note `exit 1` does **not** trigger the `ERR` trap). Prefix label is `[voting_similarities]`.

**Executor**: extractor steps (`crawl`, `parse`, `parse --recategorize`) run in a **transient, memory-capped** container — `podman run --rm --network host --memory=2048m voting-backend:latest python3 -m parliament_data_extractor.scripts.<cmd>` — **never via `podman exec` into the live backend container**. This isolates the pipeline from the API's memory cgroup: on the 4 GB CX22 VPS a peak used to SIGKILL the run (`status 137`, OOM). The VPS needs a swap file (see `deployment-steps.md`) and `UVICORN_WORKERS=2` in `.env.production` to keep headroom. The vendored `parse` also batches its work (scrutin ids fetched in chunks of 200, then loaded one page at a time) so transient memory stays bounded even on big catch-up days.

Repo config needed:
- Secrets: `LLM_API_KEY` (Groq free tier, forwarded only to the SSH session — must be a **secret**, not a variable: `vars.*` resolves to an empty string and every categorization then fails with `401 Unauthorized`), `TELEGRAM_BOT_KEY`, `TELEGRAM_CHAT_ID` (+ existing `DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_SSH_KEY`).
- VPS-side static config: `batch/.env.data` (DB `DB_*` + LLM envs; git-ignored, copy of `batch/.env.data.example`). **Auto-created** by `deploy-production.sh` from `.env.production` credentials if missing.

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
- **Request metrics**: every `/api/*` request (except `/metrics` and `/health`) is recorded in `request_metric`. `ingest_real_data.py` **preserves** that table — and `config_set` — across its re-ingest (`PRESERVED_TABLES = {"request_metric", "config_set"}`; both must stay, otherwise the `request_metric.config_set_id` FK makes `DROP TABLE config_set` fail with `DependentObjectsStillExistError`). Preserving `config_set` also keeps ConfigSet ids stable, which `/api/config` relies on for `active_set_id`. `GET /api/metrics?days=7` returns totals + per-day averages + per-endpoint breakdown; protected by Bearer `METRICS_API_KEY` when set.
- **Ingest is one transaction**: `ingest_real_data.py` rebuilds inside a single `target_engine.begin()`. Only the derived similarity tables (`DERIVED_TABLES`) are DROPped/recreated; base tables are **DELETEd in child→parent order** instead of dropped, because `DROP TABLE` needs ACCESS EXCLUSIVE and blocks live readers, while `DELETE` (ROW EXCLUSIVE) does not conflict with a reader's ACCESS SHARE. Readers therefore keep seeing the previous rows until COMMIT and then flip atomically — base data is never observed empty. Cost: transient bloat, dead `answers` tuples are not reusable until commit, so peak disk roughly doubles.
- **Dimension ids are stable**: `groups`, `roles`, `commissions`, `categories` (`DIMENSION_TABLES`) are **excluded from that bulk DELETE** and reconciled by name via `refresh_dimension()`, which keeps surviving row ids. They must stay out of the DELETE list or every row is re-inserted and renumbered — the frontend persists category ids in localStorage. Fact ids (`votes`, `voters`) do advance each run, because DELETE + re-INSERT consumes the sequence; that is intentional and harmless.
- **`INGEST_LOCK_TIMEOUT`**: the derived-table DDL needs ACCESS EXCLUSIVE, and *any* session idle in a transaction holds ACCESS SHARE on the catalogs it read, so one stuck API request can block the ingest. `SET LOCAL lock_timeout` (default `60s`, Postgres only) turns that indefinite stall into a fast, safe failure: the transaction rolls back with base data untouched and the next daily run retries. Set it lower to fail faster, never `0`/unlimited.
- **ConfigSet lifecycle**: `compute_similarities.py` **reuses** the existing row with the same `--name` (updating `w_yes/w_no/w_mismatch/m/description`) instead of inserting a duplicate. `get_config_sets.py` lists *all* rows, so unconditional inserts made the daily pipeline double its own work each run.
- **Multi‑worker DDL race**: `main.py` catches `create_all` errors during startup — one of 4 workers creates tables, the others log a warning and continue.
- **Git ignores**: `data/` (whole dir), `**/build`, `.env` files.
- **One-shot Python**: use `conda run -n comparaison_parlementaires` if you must run backend scripts outside a container. Do not install or modify packages without asking.
- **Ruff baseline**: `ruff check backend/` currently reports **27 pre-existing errors** (mostly E501 in `app/`); work should not add new violations. The vendored `backend/parliament_data_extractor/` is kept lint-clean (ruff `-`run on it targets 0 errors).
- **Vendored extractor**: `backend/parliament_data_extractor/` is now a **project-owned fork**, not an rsync mirror of the source repo (it diverges — analysis/MCA code was removed). Edit it in place. Keep its CLI entry points, DB schema, and `crawler.log`/`parser.log` stable because `batch/update-data.sh` depends on them. `parse`/`fill_gap_votes` fetch scrutin ids in bounded batches (see `_BATCH_SIZE` in `sources/an/parse.py`) and load one raw page at a time — never slot in a full-snapshot `fetchall()` of raw page HTML.
- **pydantic Settings**: `backend/app/config.py` reads `.env` from project root and now ignores unknown keys (`extra="ignore"`). Do not add secrets to it; VPS env vars come from `--env-file .env.production`.
- **Extractor LLM envs**: `LLM_*` vars only affect the extractor (reads env at runtime, Groq `qwen/qwen3.8-27b` default) — passed via `podman exec -e` in `update-data.sh`, never placed in `voting_similarities/.env`.

## Data model

- `Group` → `Voter` (FK group_id), `Vote`, `Answer` (composite PK: voter_id, vote_id)
- Similarity tables: `VoterVoterSim`, `VoterGroupSim`, `GroupGroupSim`, `GroupCohesivity`, `VoterEmbedding`, `GroupEmbedding`, `CategoryDiscriminativeness`, `ComputationMeta`
- `RequestMetric` records every API request (method, path, status, optional config_set_id, created_at)
- Many-to-many `vote_category` table joins `Vote` ↔ `Category`
