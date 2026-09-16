from __future__ import annotations

from datetime import date


class Vote:
    def __init__(
        self,
        vote_index: int,
        vote_title: str,
        vote_categories: list[str],
        vote_date: date | None = None,
        description: str = "",
    ):
        self.vote_index: int = vote_index
        self.vote_title: str = vote_title.replace("'", "")
        self.vote_categories: list[str] = vote_categories
        self.vote_date: date | None = vote_date
        self.description: str = description

    @staticmethod
    def deserialize(vote_dict: dict) -> Vote:
        raw_date = vote_dict.get("vote_date")
        parsed_date: date | None = None
        if raw_date:
            if isinstance(raw_date, date):
                parsed_date = raw_date
            elif isinstance(raw_date, str):
                parsed_date = date.fromisoformat(raw_date)
        return Vote(
            vote_index=vote_dict["vote_index"],
            vote_title=vote_dict["vote_title"],
            vote_categories=vote_dict["vote_categories"],
            vote_date=parsed_date,
            description=vote_dict.get("description", ""),
        )

    def serialize(self) -> dict:
        result: dict = {
            "vote_index": self.vote_index,
            "vote_title": self.vote_title,
            "vote_categories": self.vote_categories,
            "description": self.description,
        }
        result["vote_date"] = self.vote_date.isoformat() if self.vote_date else None
        return result
