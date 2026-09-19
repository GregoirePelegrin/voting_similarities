from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Member:
    id: int
    first_name: str
    last_name: str
    group_name: str = ""
    role: str = ""
    commission: str = ""
    circonscription: str = ""
    deputy_id: str | None = None