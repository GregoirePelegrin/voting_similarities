# parliament_data_extractor

Multi-source clustering analysis of parliamentary voting data. Currently supports the French Assemblée Nationale (AN) — built to be extensible to other chambers (Sénat, etc.).

Each source has its own PostgreSQL database with identical schema, so cross-source comparison is straightforward.

## Workflow

```
init-db --source <name>
populate-members --source <name>
crawl --source <name> [--full] [--force-refetch]
parse --source <name>
enrich-members --source <name>
analyze --source <name>
```

### 1. Init DB

Creates the database (if it doesn't exist) and all tables.

```bash
init-db --source fr_assemblee_nationale
```

The database name is read from `.env`: `DB_FR_ASSEMBLEE_NATIONALE_NAME=fr_assemblee_nationale`.

### 2. Populate members

Inserts the initial member list from the source's `groups.json`. Members include name, political group, and (optionally) role/commission/circonscription.

```bash
populate-members --source fr_assemblee_nationale
```

### 3. Crawl

Fetches raw HTML pages for each scrutin vote from the AN website and stores them in `raw_pages`.

```bash
# Delta — only fetches IDs not yet stored
crawl --source fr_assemblee_nationale

# Full — iterates all IDs from 1 to max_id (fills gaps)
crawl --source fr_assemblee_nationale --full

# Force re-fetch even if cached
crawl --source fr_assemblee_nationale --full --force-refetch
```

The crawler uses range-based iteration (1 to max_id) rather than scraping the paginated listing, ensuring all scrutins are discovered regardless of listing page limits. A shared `requests.Session()` is used for TCP connection reuse. If a request fails (e.g. stale connection or server 503), the session is rebuilt and the request is retried once. Progress is logged every 100 IDs.

Use `--full` without `--force-refetch` to fill gaps from a previous interrupted crawl — cached IDs skip instantly, only missing ones are fetched.

### 4. Parse

Parses raw HTML pages into structured `votes` and `bulletins` records. Each scrutin's title is sent to an LLM for category assignment (local Ollama-compatible server by default, or the Groq free tier — see [LLM categorization](#llm-categorization)).

During parsing, members referenced in the vote breakdown are created on-the-fly (with deputy_id) if they don't already exist in the members table.

```bash
parse --source fr_assemblee_nationale
```

If the LLM was unavailable during a previous parse run, votes were stored with empty categories. Re-run categorization once the LLM is back:

```bash
parse --source fr_assemblee_nationale --recategorize
```

This finds all votes with null or empty categories, re-runs the LLM on their titles, and updates the `categories` column in-place. It does not touch raw_pages or bulletins.

### 5. Enrich members

AN scrutin pages don't include role/commission/circonscription. This step fetches each deputy's profile page to fill those fields.

```bash
enrich-members --source fr_assemblee_nationale
```

### 6. Analyze

Runs the full clustering pipeline: MCA dimensionality reduction, K-Means clustering, extrema identification, and an interactive scatter plot with hover annotations.

```bash
analyze --source fr_assemblee_nationale
```

## Setup

### Prerequisites

- Python 3.10+
- PostgreSQL (running in a Podman container by default)
- An LLM endpoint for categorization: either a local Ollama-compatible server at `http://localhost:1234/v1` or a Groq API key (`LLM_API_KEY`)

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

Database credentials are source-prefixed: `DB_{SOURCE}_NAME`. The host/user/password/port are shared across sources.

### LLM categorization

`LLMService` reads its configuration from the environment (see `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `LLM_BASE_URL` | `http://localhost:1234/v1` | Base endpoint (`/chat/completions` is appended). Set to `https://api.groq.com/openai/v1` for Groq |
| `LLM_API_KEY` | *(unset → no auth header)* | Bearer token sent when set (required for Groq) |
| `LLM_MODEL_BIG` | `qwen/qwen3.8-27b` | Model used for categorization (non-reasoning, no hidden thought tokens) |
| `LLM_MODEL_SMALL` | `llama-3.1-8b-instant` | Reserved for smaller tasks |
| `LLM_MAX_TOKENS` | `200` | Max completion tokens |
| `LLM_TEMPERATURE` | `0.7` | Sampling temperature |
| `LLM_TIMEOUT` | `60` | Per-request timeout in seconds |
| `LLM_MAX_RETRIES` | `3` | Retries on failures/rate limits (honors `Retry-After`) |

If the LLM is unavailable or a request fails, votes are stored with empty categories; re-run `parse --source <name> --recategorize` once the provider is back.

## Database schema

| Table | Purpose |
|-------|---------|
| `members` | Parliament members (name, group, role, commission, circonscription, deputy_id) |
| `votes` | Scrutin data (title, date, LLM-assigned categories) |
| `bulletins` | Individual vote records (Pour/Contre/Abstention per member per vote) |
| `raw_pages` | Raw HTML cache of scrutin pages (avoids re-crawling) |
| `failed_votes` | Failed parse or crawl attempts (for retry debugging) |

## Package structure

```
src/parliament_data_extractor/
├── common/              # Shared across sources
│   ├── config.py        # Category definitions
│   ├── schema.py        # DDL statements & migrations
│   ├── models/          # Data classes (Member, Vote, Bulletin, RawPage)
│   └── services/        # Database, LLM service
├── sources/
│   └── an/              # AN-specific code
│       ├── config.py    # BASE_URL, constants
│       ├── crawl.py     # Raw page fetcher
│       ├── parse.py     # HTML parser + LLM categorization
│       ├── populate_members.py  # groups.json import
│       └── groups.json  # Flat list of all deputies
├── analysis/
│   ├── clustering.py    # MCA + K-Means pipeline
│   └── annotated_graph.py  # Interactive scatter plot
└── scripts/
    ├── crawl.py
    ├── parse.py
    ├── analyze.py
    ├── init_db.py
    ├── populate_members.py
    └── enrich_members.py
```

## Adding a new source

1. Create `src/parliament_data_extractor/sources/<name>/` with `config.py`, `crawl.py`, `parse.py`, `populate_members.py`
2. Add `DB_{NAME}_NAME=<database_name>` to `.env`
3. Register entry points in `pyproject.toml` if needed
4. Run `init-db --source <name>` to create the database
