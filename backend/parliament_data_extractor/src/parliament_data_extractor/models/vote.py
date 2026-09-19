from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True, slots=True)
class Vote:
    id: int
    title: str
    categories: list[str]
    date: date | None = None
    description: str = ""
    scrutin_id: int | None = None