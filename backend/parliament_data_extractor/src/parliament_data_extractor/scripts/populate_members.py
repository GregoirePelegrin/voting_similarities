from __future__ import annotations

import argparse

from parliament_data_extractor.logging_conf import setup_logging
from parliament_data_extractor.scripts.cli import add_source_argument
from parliament_data_extractor.sources.an.populate_members import main as populate_an


def main() -> None:
    setup_logging()
    parser = argparse.ArgumentParser(
        description="Populate members from groups.json"
    )
    add_source_argument(parser)
    args = parser.parse_args()

    populate_an(source=args.source)


if __name__ == "__main__":
    main()