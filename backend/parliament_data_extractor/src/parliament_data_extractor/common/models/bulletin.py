from __future__ import annotations


class Bulletin:
    def __init__(self, vote_index: int, member_index: int, vote: str):
        self.vote_index: int = vote_index
        self.member_index: int = member_index
        self.vote: str = vote

    @staticmethod
    def deserialize(bulletin_dict: dict) -> Bulletin:
        return Bulletin(
            vote_index=bulletin_dict["vote_index"],
            member_index=bulletin_dict["member_index"],
            vote=bulletin_dict["vote"],
        )

    def serialize(self) -> dict:
        return {
            "vote_index": self.vote_index,
            "member_index": self.member_index,
            "vote": self.vote,
        }
