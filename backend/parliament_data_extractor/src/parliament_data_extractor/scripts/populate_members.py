from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from parliament_data_extractor.sources.an.populate_members import main as an_populate

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    force=True,
)
log = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description="Populate members from groups.json"
    )
    parser.add_argument(
        "--source",
        default="an",
        help="Source name (default: an)",
    )
    args = parser.parse_args()

    an_populate(source=args.source)


if __name__ == "__main__":
    main()
