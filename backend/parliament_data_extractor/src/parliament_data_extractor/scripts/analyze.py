from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from parliament_data_extractor.analysis.clustering import main as run_clustering

log = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    force=True,
)


def main():
    parser = argparse.ArgumentParser(
        description="Run clustering analysis on a parliamentary source"
    )
    parser.add_argument(
        "--source",
        default="an",
        help="Source name (default: an)",
    )
    args = parser.parse_args()

    run_clustering(source=args.source)


if __name__ == "__main__":
    main()
