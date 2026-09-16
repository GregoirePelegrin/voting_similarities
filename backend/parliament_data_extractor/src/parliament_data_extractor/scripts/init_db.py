from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

import psycopg2
from dotenv import load_dotenv

from parliament_data_extractor.common.schema import create_all_tables
from parliament_data_extractor.common.services.database import Database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    force=True,
)
log = logging.getLogger(__name__)


def create_database(source: str):
    load_dotenv()
    db_name = os.getenv(f"DB_{source.upper()}_NAME")
    if not db_name:
        log.error("DB_%s_NAME not set in .env", source.upper())
        sys.exit(1)

    conn = psycopg2.connect(
        dbname="postgres",
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
    )
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT 1 FROM pg_database WHERE datname = '{db_name}';"
        )
        exists = cur.fetchone()
        if not exists:
            cur.execute(f"CREATE DATABASE {db_name};")
            log.info("Created database '%s'", db_name)
        else:
            log.info("Database '%s' already exists", db_name)
    conn.close()

    Database._instances.pop(source, None)
    db = Database.get(source=source)
    create_all_tables(db)
    log.info("Schema created for source '%s'", source)


def main():
    parser = argparse.ArgumentParser(
        description="Initialize a database for a parliamentary source"
    )
    parser.add_argument(
        "--source",
        required=True,
        help="Source name (e.g. an, senat)",
    )
    args = parser.parse_args()
    create_database(source=args.source)


if __name__ == "__main__":
    main()
