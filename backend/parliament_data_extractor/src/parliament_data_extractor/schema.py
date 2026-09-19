from __future__ import annotations

CREATE_MEMBERS = """
    CREATE TABLE IF NOT EXISTS members (
        id              SERIAL PRIMARY KEY,
        first_name      TEXT NOT NULL,
        last_name       TEXT NOT NULL,
        group_name      TEXT,
        role            TEXT,
        commission      TEXT,
        circonscription TEXT,
        deputy_id       TEXT UNIQUE
    );
"""

CREATE_VOTES = """
    CREATE TABLE IF NOT EXISTS votes (
        id          SERIAL PRIMARY KEY,
        title       TEXT NOT NULL,
        categories  TEXT[],
        date        DATE,
        description TEXT DEFAULT '',
        scrutin_id  INT
    );
"""

CREATE_BULLETINS = """
    CREATE TABLE IF NOT EXISTS bulletins (
        vote_id     INT REFERENCES votes(id) ON DELETE CASCADE,
        member_id   INT REFERENCES members(id) ON DELETE CASCADE,
        vote        TEXT NOT NULL,
        PRIMARY KEY (vote_id, member_id)
    );
"""

CREATE_RAW_PAGES = """
    CREATE TABLE IF NOT EXISTS raw_pages (
        scrutin_id  INT PRIMARY KEY,
        url         TEXT NOT NULL,
        html        TEXT NOT NULL,
        fetched_at  TIMESTAMP DEFAULT NOW(),
        processed   BOOLEAN NOT NULL DEFAULT FALSE
    );
"""

CREATE_FAILED_VOTES = """
    CREATE TABLE IF NOT EXISTS failed_votes (
        vote_id        INT PRIMARY KEY,
        url            TEXT NOT NULL,
        error_msg      TEXT,
        attempt_count  INT DEFAULT 1,
        last_attempt   TIMESTAMP DEFAULT NOW()
    );
"""

MIGRATE_RAW_PAGES_VOTE_ID = """
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'raw_pages' AND column_name = 'vote_id'
        ) THEN
            ALTER TABLE raw_pages RENAME COLUMN vote_id TO scrutin_id;
        END IF;
    END
    $$;
"""

MIGRATE_RAW_PAGES_PROCESSED = """
    ALTER TABLE raw_pages
    ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT FALSE;
"""

MIGRATE_MEMBERS_DEPUTY_ID = """
    ALTER TABLE members
    ADD COLUMN IF NOT EXISTS deputy_id TEXT;
"""

MIGRATE_MEMBERS_DEPUTY_ID_UNIQUE = """
    CREATE UNIQUE INDEX IF NOT EXISTS idx_members_deputy_id
    ON members (deputy_id) WHERE deputy_id IS NOT NULL;
"""

DDL_STATEMENTS: tuple[str, ...] = (
    CREATE_MEMBERS,
    CREATE_VOTES,
    CREATE_BULLETINS,
    CREATE_RAW_PAGES,
    CREATE_FAILED_VOTES,
    MIGRATE_RAW_PAGES_VOTE_ID,
    MIGRATE_RAW_PAGES_PROCESSED,
    MIGRATE_MEMBERS_DEPUTY_ID,
    MIGRATE_MEMBERS_DEPUTY_ID_UNIQUE,
)