from __future__ import annotations

import argparse
import logging
import re

import psycopg2
from psycopg2.sql import SQL, Identifier

from parliament_data_extractor.config import ExtractorSettings
from parliament_data_extractor.database import ParliamentDatabase
from parliament_data_extractor.logging_conf import setup_logging

log = logging.getLogger(__name__)

_VALID_IDENTIFIER = re.compile(r"^[a-z_][a-z0-9_]*$")


def database_ready(source: str) -> None:
    settings = ExtractorSettings()
    db_name = settings.db_name(source)

    admin_conn = psycopg2.connect(**settings.psycopg_connect_kwargs("postgres"))
    admin_conn.autocommit = True
    try:
        with admin_conn.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s", (db_name,)
            )
            if cursor.fetchone() is not None:
                log.info("Database '%s' already exists", db_name)
            else:
                if not _VALID_IDENTIFIER.match(db_name):
                    raise ValueError(f"invalid database name: {db_name!r}")
                cursor.execute(
                    SQL("CREATE DATABASE {}").format(Identifier(db_name))
                )
                log.info("Created database '%s'", db_name)
    finally:
        admin_conn.close()

    db = ParliamentDatabase(source)
    db.close()
    log.info("Schema ensured for source '%s'", source)


def main() -> None:
    setup_logging()
    parser = argparse.ArgumentParser(
        description="Initialize a database for a parliamentary source"
    )
    parser.add_argument(
        "--source",
        required=True,
        help="Source name (e.g. an, fr_assemblee_nationale)",
    )
    args = parser.parse_args()
    database_ready(args.source)


if __name__ == "__main__":
    main()