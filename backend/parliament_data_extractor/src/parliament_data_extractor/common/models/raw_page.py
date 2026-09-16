from __future__ import annotations

from datetime import datetime


class RawPage:
    def __init__(
        self,
        scrutin_id: int,
        url: str,
        html: str,
        fetched_at: datetime | None = None,
    ):
        self.scrutin_id: int = scrutin_id
        self.url: str = url
        self.html: str = html
        self.fetched_at: datetime | None = fetched_at

    @staticmethod
    def deserialize(data: dict) -> RawPage:
        raw_fetched = data.get("fetched_at")
        parsed: datetime | None = None
        if raw_fetched:
            if isinstance(raw_fetched, datetime):
                parsed = raw_fetched
            elif isinstance(raw_fetched, str):
                parsed = datetime.fromisoformat(raw_fetched)
        return RawPage(
            scrutin_id=data["scrutin_id"],
            url=data["url"],
            html=data["html"],
            fetched_at=parsed,
        )

    def serialize(self) -> dict:
        return {
            "scrutin_id": self.scrutin_id,
            "url": self.url,
            "html": self.html,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
        }
