from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class RawPage:
    scrutin_id: int
    url: str
    html: str
    fetched_at: datetime | None = None
    processed: bool = False