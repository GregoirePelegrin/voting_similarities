from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Bulletin:
    vote_id: int
    member_id: int
    vote: str