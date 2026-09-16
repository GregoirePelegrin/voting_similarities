from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from parliament_data_extractor.sources.an.parse import main as an_parse

log = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("parser.log")],
    force=True,
)


def main():
    parser = argparse.ArgumentParser(
        description="Parse raw HTML pages into votes and bulletins"
    )
    parser.add_argument(
        "--source",
        default="an",
        help="Source name (default: an)",
    )
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

    an_parse(
        source=args.source,
        recategorize=args.recategorize,
        fill_gaps=args.fill_gaps,
    )


if __name__ == "__main__":
    main()
