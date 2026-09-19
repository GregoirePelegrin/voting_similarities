from __future__ import annotations

import argparse

from parliament_data_extractor.logging_conf import setup_logging
from parliament_data_extractor.scripts.cli import add_source_argument
from parliament_data_extractor.sources.an.parse import main as parse_an


def main() -> None:
    setup_logging("parser.log")
    parser = argparse.ArgumentParser(
        description="Parse raw HTML pages into votes and bulletins"
    )
    add_source_argument(parser)
    parser.add_argument(
        "--recategorize",
        action="store_true",
        help="Re-run LLM categorization on votes with empty categories",
    )
    parser.add_argument(
        "--fill-gaps",
        action="store_true",
        help="Re-process raw pages that have no corresponding vote",
    )
    args = parser.parse_args()

    parse_an(
        source=args.source,
        recategorize=args.recategorize,
        fill_gaps=args.fill_gaps,
    )


if __name__ == "__main__":
    main()