from __future__ import annotations

import argparse

from parliament_data_extractor.logging_conf import setup_logging
from parliament_data_extractor.scripts.cli import add_source_argument
from parliament_data_extractor.sources.an.crawl import main as crawl_an


def main() -> None:
    setup_logging("crawler.log")
    parser = argparse.ArgumentParser(
        description="Crawl raw HTML pages from a parliamentary source"
    )
    add_source_argument(parser)
    parser.add_argument(
        "--full",
        action="store_true",
        help="Full crawl: discover and fetch all existing scrutins IDs",
    )
    parser.add_argument(
        "--force-refetch",
        action="store_true",
        help="Re-fetch pages from web even if cached in raw_pages",
    )
    args = parser.parse_args()

    crawl_an(
        source=args.source,
        full=args.full,
        force_refetch=args.force_refetch,
    )


if __name__ == "__main__":
    main()