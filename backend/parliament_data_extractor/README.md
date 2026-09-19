# parliament_data_extractor

Crawls and parses French Assemblée Nationale (AN) voting data into PostgreSQL.
Multi-source by design — currently only `an` — each source gets its own database
with an identical schema. Built as a **project-owned fork** of a standalone
package, shipped as plain source inside the `voting_similarities` backend image
(runs via `python3 -m parliament_data_extractor.scripts.<cmd>`, `PYTHONPATH=/app`).

## Workflow

```
init-db --source <name>
populate-members --source <name>
crawl --source <name> [--full] [--force-refetch]
parse --source <name>
enrich-members --source <name>
```

### 1. Init DB

Creates the database (if it doesn't exist) and all tables.

```bash
init-db --source fr_assemblee_nationale
```

The database name is read from `DB_{SOURCE}_NAME`:

```
DB_FR_ASSEMBLEE_NATIONALE_NAME=fr_assemblee_nationale
```

### 2. Populate members

Inserts the initial member list from the source's `groups.json`. Members include
name, political group, and (optionally) role/commission/circonscription.

```bash
populate-members --source fr_assemblee_nationale
```

### 3. Crawl

Fetches raw HTML pages for each scrutin vote from the AN website and stores them
in `raw_pages`.

```bash
# Delta — only fetches IDs not yet stored
crawl --source fr_assemblee_nationale

# Full — iterates all IDs from 1 to max_id (fills gaps)
crawl --source fr_assemblee_nationale --full

# Force re-fetch even if cached
crawl --source fr_assemblee_nationale --full --force-refetch
```

The crawler discovers the highest scrutin ID from the listing page, then iterates
range-based IDs (1..max_id) so every scrutin is found regardless of pagination.
A shared `requests.Session()` is used for TCP reuse; failed requests rebuild the
session and retry up to 3 times. Progress is logged every 100 IDs.

Use `--full` without `--force-refetch` to fill gaps from a previous interrupted
crawl — cached IDs skip instantly, only missing ones are fetched.

### 4. Parse

Parses raw HTML pages into structured `votes` and `bulletins` records. Each
scrutin's title is sent to an LLM for category assignment (Groq free tier by
default — see [LLM categorization](#llm-categorization)).

During parsing, members referenced in the vote breakdown are created on-the-fly
(with `deputy_id`) if they don't already exist in the members table.

```bash
parse --source fr_assemblee_nationale
```

If the LLM was unavailable during a previous parse run, votes were stored with
empty categories. Re-run categorization once the provider is back:

```bash
parse --source fr_assemblee_nationale --recategorize
```

This finds all votes with null/empty categories, re-runs the LLM on their titles,
and updates the `categories` column in place. It does not touch raw_pages or
bulletins. `parse --fill-gaps` re-processes raw pages that never produced a vote.

### 5. Enrich members

AN scrutin pages don't include role/commission/circonscription. This step fetches
each deputy's profile page to fill those fields.

```bash
enrich-members --source fr_assemblee_nationale
```

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL (`localhost:5432`, dev creds `postgres`/`postgres`)
- An LLM endpoint for categorization (default `https://api.groq.com/openai/v1` with `LLM_API_KEY`)

### Install

```bash
pip install -e .
```

### Environment

Create a `.env` file (copy from `.env.example`):

```env
DB_FR_ASSEMBLEE_NATIONALE_NAME=fr_assemblee_nationale
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
```

Database name is source-prefixed: `DB_{SOURCE}_NAME`. Host/user/password/port are
shared across sources. In production these are injected via `podman exec -e` by
`voting_similarities/batch/update-data.sh` — never committed.

### LLM categorization

`LLMService` reads its configuration from the environment (see `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Base endpoint (`/chat/completions` is appended) |
| `LLM_API_KEY` | *(unset → no auth header)* | Bearer token sent when set (required for Groq) |
| `LLM_MODEL_BIG` | `qwen/qwen3.8-27b` | Model used for categorization (non-reasoning, no hidden chain-of-thought tokens) |
| `LLM_MODEL_SMALL` | `llama-3.1-8b-instant` | Reserved for smaller tasks |
| `LLM_MAX_TOKENS` | `200` | Max completion tokens |
| `LLM_TEMPERATURE` | `0.7` | Sampling temperature |
| `LLM_TIMEOUT` | `60` | Per-request timeout in seconds |
| `LLM_MAX_RETRIES` | `3` | Retries on failures/rate limits (honors `Retry-After`) |

If a request fails after all retries, the vote is stored with empty categories;
re-run `parse --source <name> --recategorize` once the provider is back. The
prompt forces French answers restricted to the 14 allowed categories in
`categories.py`; replies are normalized (fences, separators, dedupe, empties)
before fuzzy-matching via `match_category`.

## Database schema

| Table | Purpose |
|-------|---------|
| `members` | Parliament members (name, group, role, commission, circonscription, deputy_id) |
| `votes` | Scrutin data (title, date, LLM-assigned categories) |
| `bulletins` | Individual vote records (Pour/Contre/Abstention per member per vote) |
| `raw_pages` | Raw HTML cache of scrutin pages (avoids re-crawling) |
| `failed_votes` | Failed parse or crawl attempts (for retry debugging) |

DDL lives in `schema.py` and runs idempotently on every `ParliamentDatabase`
connection (plus column migrations).

## Package structure

```
src/parliament_data_extractor/
├── config.py          # env-driven settings (DB creds + LLM) via pydantic-settings
├── categories.py      # the 14 allowed French vote categories
├── schema.py          # DDL statements & migrations
├── text.py            # accent/& normalization + fuzzy category matching
├── database.py        # ParliamentDatabase (psycopg2, per-source connections)
├── llm.py             # LLMService (chat completions + retry/backoff)
├── logging_conf.py    # setup_logging()
├── models/            # Member, Vote, Bulletin, RawPage dataclasses
├── sources/
│   └── an/            # AN-specific configuration and pipeline
│       ├── config.py          # BASE_URL, UA, group-name overrides
│       ├── crawl.py           # ScrutinCrawler (raw page fetcher)
│       ├── parse.py           # VotePageParser + LLM categorization
│       ├── populate_members.py  # groups.json import
│       ├── enrich_members.py  # deputy profile enrichment
│       └── groups.json        # flat list of all deputies
└── scripts/           # thin argparse wrappers → console entry points
```

## Adding a new source

1. Create `src/parliament_data_extractor/sources/<name>/` with `config.py`, `crawl.py`, `parse.py`, `populate_members.py`
2. Set `DB_{NAME}_NAME=<database_name>` in the environment
3. Register entry points in `pyproject.toml` if needed
4. Run `init-db --source <name>` to create the database