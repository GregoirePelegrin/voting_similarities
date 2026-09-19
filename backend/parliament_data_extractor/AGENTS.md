# AGENTS.md — parliament_data_extractor

Python package `parliament_data_extractor` (`src/` layout, install via `pip install -e .`).
Crawls French Assemblée Nationale (AN) voting data into PostgreSQL. This vendored copy
is a **project-owned fork**: it diverges from the original source repo and is kept
deliberately lean (no analysis/MCA code — that was removed). Multi-source by design —
currently only `an` — each source gets its own database with an identical schema.

This copy is **shipped as plain files** into the `voting_similarities` backend image
(`/app/parliament_data_extractor`, imported via `PYTHONPATH=/app`). It is NOT a git
submodule or an rsync mirror; edits are made here directly. Keep the pipeline
contract stable (CLI entry points, schema, log files) because
`voting_similarities/batch/update-data.sh` depends on it.

## Commands

All commands are console entry points and take `--source <name>`:

```bash
init-db --source fr_assemblee_nationale                  # create DB + tables
populate-members --source fr_assemblee_nationale         # import groups.json members
crawl --source fr_assemblee_nationale                    # delta: fetch scrutins not yet stored
crawl --source fr_assemblee_nationale --full             # iterate all IDs 1..max_id (fills gaps)
crawl --source fr_assemblee_nationale --full --force-refetch  # ignore raw_pages cache
parse --source fr_assemblee_nationale                    # raw_pages → votes + bulletins (+ LLM categories)
parse --source fr_assemblee_nationale --recategorize     # re-run LLM on votes with empty categories
parse --source fr_assemblee_nationale --fill-gaps        # re-process raw pages with no vote
enrich-members --source fr_assemblee_nationale           # fetch role/commission/circonscription per deputy
```

Crawl writes to `crawler.log`, parse writes to `parser.log` (current directory).

## Structure

```
src/parliament_data_extractor/
├── config.py          # pydantic-settings: DB_* creds + LLM_* config (env-driven)
├── categories.py      # CATEGORIES: the 14 allowed French vote categories
├── schema.py          # DDL + idempotent migrations (DDL_STATEMENTS)
├── database.py        # ParliamentDatabase (psycopg2) — per-source cached connections
├── llm.py             # LLMService (chat completions + retry/backoff)
├── text.py            # normalize_text / build_normalized_map / match_category
├── logging_conf.py    # setup_logging(log_file=None)
├── models/            # Member, Vote, Bulletin, RawPage (frozen dataclasses)
├── sources/an/        # AN-specific: config/crawl/parse/populate_members/enrich_members + groups.json
└── scripts/           # thin argparse wrappers → console entry points
```

## Database schema

Tables: `members`, `votes`, `bulletins`, `raw_pages`, `failed_votes`. The
authoritative DDL lives in `schema.py`; it runs idempotently on every
`ParliamentDatabase` connection (plus column migrations). Noteworthy:

- `raw_pages` is keyed by `scrutin_id` (renamed from the legacy `vote_id`) and has
  a `processed BOOLEAN` flag.
- `members` has a unique `deputy_id` — scrutins reference deputies by their PA ID.
- `bulletins` uses a composite PK `(vote_id, member_id)`; `vote` is the AN status
  text (e.g. Pour / Contre / Abstention).
- `votes.categories` is `TEXT[]`, assigned by the LLM.

## Style

- `from __future__ import annotations` first in every file.
- Import order: stdlib → third-party (alphabetical) → local (`parliament_data_extractor.*`, alphabetical).
- Type hints everywhere; use `| None` for optionals; `collections.abc` for collections.
- Constants UPPER_SNAKE_CASE, classes PascalCase, functions/variables snake_case, 4-space indent, f-strings.
- `ParliamentDatabase.get(source)` returns the cached per-source connection;
  `close_all()` closes them all. `init_db` constructs a fresh instance directly.
- DB access uses the `transaction()` context manager and **parameterized `%s`
  queries only** — never f-string SQL. Dynamic identifiers go through
  `psycopg2.sql.Identifier` (see `scripts/init_db.py`).
- Raise `ValueError` with a descriptive message for not-found conditions.
- Avoid comments; use `# todo:` sparingly.
- Lint: `conda run -n agents_course ruff check backend/parliament_data_extractor/`
  from the `voting_similarities` repo — keep it at 0 errors.

## LLM categorization

`LLMService` is env-driven: it posts vote titles to `LLM_BASE_URL/chat/completions`
(Groq free tier default `https://api.groq.com/openai/v1` with `LLM_API_KEY`, or a
local Ollama-compatible server). Categorization model is `LLM_MODEL_BIG` (default
`qwen/qwen3.8-27b` — the `openai/gpt-oss-*` models are reasoning models that spend
tokens on hidden chain-of-thought and can return empty `content` if `max_tokens` is
too small). The prompt forces French answers restricted to the 14 categories in
`categories.py`. It retries with backoff, honoring `Retry-After`. `sources/an/parse.py`
normalizes the reply (fences, separators, dedupe, empties) before fuzzy-matching via
`match_category`.

Env var names must match `batch/update-data.sh` and the vendored `.env.example`
(`LLM_TIMEOUT`, not `LLM_TIMEOUT_SECONDS`).