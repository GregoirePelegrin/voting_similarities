from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from parliament_data_extractor.sources.an.crawl import main as an_crawl

log = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("crawler.log")],
    force=True,
)


def main():
    parser = argparse.ArgumentParser(
        description="Crawl raw HTML pages from a parliamentary source"
    )
    parser.add_argument(
        "--source",
        default="an",
        help="Source name (default: an)",
    )
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

    an_crawl(
        source=args.source,
        full=args.full,
        force_refetch=args.force_refetch,
    )


if __name__ == "__main__":
    main()
