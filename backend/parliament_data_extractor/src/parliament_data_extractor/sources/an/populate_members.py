from __future__ import annotations

import json
import logging
from pathlib import Path

from parliament_data_extractor.database import ParliamentDatabase
from parliament_data_extractor.models.member import Member

log = logging.getLogger(__name__)

_GROUPS_JSON = Path(__file__).resolve().parent / "groups.json"


def load_groups(path: Path = _GROUPS_JSON) -> list[Member]:
    with path.open(encoding="utf-8") as file:
        groups = json.load(file)
    return [
        Member(
            id=0,
            first_name=entry["firstname"],
            last_name=entry["lastname"],
            group_name=entry["group"],
            role=entry.get("role", ""),
            commission=entry.get("commission", ""),
            circonscription=entry.get("circonscription", ""),
        )
        for entry in groups
    ]


def main(*, source: str = "an") -> int:
    db = ParliamentDatabase.get(source)
    members = load_groups()
    for member in members:
        db.store_member_if_not_exists(member)
    log.info("Stored %d members", len(members))
    return len(members)