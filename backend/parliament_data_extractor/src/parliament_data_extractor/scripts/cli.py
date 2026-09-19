from __future__ import annotations

import argparse


def add_source_argument(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--source",
        default="an",
        help="Source name (default: an)",
    )