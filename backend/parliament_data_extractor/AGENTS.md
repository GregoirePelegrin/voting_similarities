# AGENTS.md — parliament_data_extractor

Python package `parliament_data_extractor` (`src/` layout, install via `pip install -e .`).
Crawls French Assemblée Nationale (AN) voting data into PostgreSQL, then runs
MCA + K-Means clustering analysis. Multi-source by design — currently only `an` —
each source gets its own database with an identical schema. See `README.md` for
the full workflow.

## Commands

All commands are console entry points and take `--source <name>` (default `an`):

```bash
init-db --source fr_assemblee_nationale                  # create DB + tables
populate-members --source fr_assemblee_nationale         # import groups.json members
crawl --source fr_assemblee_nationale                    # delta: fetch scrutins not yet stored
crawl --source fr_assemblee_nationale --full             # iterate all IDs 1..max_id (fills gaps)
crawl --source fr_assemblee_nationale --full --force-refetch  # ignore raw_pages cache
parse --source fr_assemblee_nationale                    # raw_pages → votes + bulletins (+ LLM categories)
parse --source fr_assemblee_nationale --recategorize     # re-run LLM on votes with empty categories
enrich-members --source fr_assemblee_nationale           # fetch role/commission/circonscription per deputy
analyze --source fr_assemblee_nationale                  # MCA + K-Means + interactive scatter plot
```

Crawl writes to `crawler.log`, parse to `parser.log` (project root).

## Environment (.env)

- Credentials are loaded from `.env` (git-ignored) via `python-dotenv` (see `.env.example`).
- DB name is source-prefixed: `DB_{SOURCE}_NAME`. Host/user/password/port are
  shared: `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` (dev: `postgres`/`postgres`
  at `localhost:5432`).
- LLM config is env-driven: `LLM_BASE_URL` (default `http://localhost:1234/v1`
  for a local Ollama-compatible server; use `https://api.groq.com/openai/v1` for
  Groq), `LLM_API_KEY` (optional Bearer token), `LLM_MODEL_BIG`
  (`qwen/qwen3.8-27b` — non-reasoning; the gpt-oss-20b/120b default burns
  ~100-150 tokens on chain-of-thought before answering), `LLM_MODEL_SMALL`
  (`llama-3.1-8b-instant`), `LLM_MAX_TOKENS` (200), `LLM_TEMPERATURE` (0.7),
  `LLM_TIMEOUT` (60), `LLM_MAX_RETRIES` (3).

## Structure

```
src/parliament_data_extractor/
├── common/          # shared across sources
│   ├── config.py    # predefined vote categories
│   ├── schema.py    # DDL + idempotent migrations (create_all_tables)
│   ├── models/      # Member, Vote, Bulletin, RawPage dataclasses
│   ├── services/    # Database (psycopg2), LLMService
│   └── utils/       # SingletonMetaclass, text_utils
├── sources/an/      # AN-specific crawl.py / parse.py / populate_members.py + groups.json
├── analysis/        # clustering.py (MCA + K-Means), annotated_graph.py
└── scripts/         # thin argparse wrappers → entry points
```

## Database schema

Tables: `members`, `votes`, `bulletins`, `raw_pages`, `failed_votes`. The
authoritative DDL lives in `common/schema.py`; `create_all_tables` runs idempotently
on every `Database` connection (plus column migrations). Noteworthy:

- `raw_pages` is keyed by `scrutin_id` (renamed from `vote_id`) and has a
  `processed BOOLEAN` flag.
- `members` has a unique `deputy_id` — scrutins reference deputies by their PA ID.
- `bulletins` uses a composite PK `(vote_id, member_id)`; `vote` is the AN status
  text (e.g. Pour / Contre / Abstention).
- `votes.categories` is `TEXT[]`, assigned by the LLM.

## Style

- `from __future__ import annotations` first in every file.
- Import order: stdlib → third-party (alphabetical) → local (`parliament_data_extractor.*`, alphabetical).
- Type hints everywhere; use `| None` for optionals (Python 3.10+).
- Constants UPPER_SNAKE_CASE, classes PascalCase, functions/variables snake_case, 4-space indent, f-strings.
- Services are singletons via `SingletonMetaclass` (`common/utils/metaclass.py`).
  `Database.get(source)` returns the cached per-source connection; `Database.create(source)` opens a fresh one.
- DB access uses `contextlib.closing` and **parameterized `%s` queries only** —
  never f-string SQL. Always `commit()` after writes.
- Raise `ValueError` with a descriptive message for not-found conditions.
- Avoid comments; use `# todo:` sparingly.

## Analysis pipeline (`analysis/clustering.py`)

```
Database.get(source).get_votes_dataframe()   # base_df; first column is "name"
fill_base_df(df)                             # KNNImputer, n_neighbors=2
compute_mca_n(df)                            # smallest n reaching ~90% explained inertia
compute_dimension_reduction(df, n)           # prince MCA fit_transform
fixed_clusterization(df)                     # KMeans, 5 clusters, random_state=42
```

DataFrame convention: first column is always the member name (`df.iloc[:, 1:]`
for numeric data; re-add with `.insert(0, "name", ...)`). Member name format is
`"{lastname}<splitter/>{firstname}"`.

## LLM categorization

`LLMService` is env-driven: it posts vote titles to `LLM_BASE_URL/chat/completions`
(default a local Ollama-compatible server at `http://localhost:1234/v1`, or
`https://api.groq.com/openai/v1` with `LLM_API_KEY` for the Groq free tier).
Model for categorization is `LLM_MODEL_BIG` (default `qwen/qwen3.8-27b` as of
2026 — the `openai/gpt-oss-*` models are reasoning models that spend tokens on
hidden chain-of-thought and can return empty `content` if `max_tokens` is too
small). The prompt forces French answers restricted to the allowed list. It
retries on failures with backoff, honoring the `Retry-After` header. Allowed
categories are predefined in `common/config.py` (French names like
`Éducation & Recherche`). `sources/an/parse.py:categorizer` normalizes the LLM
reply (fences, separators, dedupe, empties) before fuzzy-matching via `match_category`.
