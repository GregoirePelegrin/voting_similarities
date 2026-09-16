from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from parliament_data_extractor.common.models.member import Member
from parliament_data_extractor.common.services.database import Database

log = logging.getLogger(__name__)

GROUPS_JSON = Path(__file__).resolve().parent / "groups.json"


def main(source: str = "an"):
    svc = Database.get(source=source)

    with open(GROUPS_JSON, encoding="utf-8") as f:
        groups = json.load(f)

    count = 0
    for m in groups:
        member = Member.deserialize(
            {
                "firstname": m["firstname"],
                "lastname": m["lastname"],
                "group": m["group"],
                "role": m.get("role", ""),
                "commission": m.get("commission", ""),
                "circonscription": m.get("circonscription", ""),
            }
        )
        svc.store_member_if_not_exists(member=member)
        count += 1

    log.info("Stored %d members", count)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Populate members from groups.json"
    )
    parser.add_argument(
        "--source",
        default="an",
        help="Source name (default: an)",
    )
    args = parser.parse_args()
    main(source=args.source)
