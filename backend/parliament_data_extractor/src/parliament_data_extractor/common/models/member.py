from __future__ import annotations


class Member:
    def __init__(
        self,
        member_index: int,
        firstname: str,
        lastname: str,
        group: str,
        role: str,
        commission: str,
        circonscription: str,
        deputy_id: str = "",
    ):
        self.member_index: int = member_index
        self.firstname: str = firstname
        self.lastname: str = lastname
        self.group: str = group
        self.role: str = role
        self.commission: str = commission
        self.circonscription: str = circonscription
        self.deputy_id: str = deputy_id

    @staticmethod
    def deserialize(member_dict: dict) -> Member:
        return Member(
            member_index=member_dict.get("member_index", 0),
            firstname=member_dict["firstname"],
            lastname=member_dict["lastname"],
            group=member_dict["group"],
            role=member_dict["role"],
            commission=member_dict["commission"],
            circonscription=member_dict["circonscription"],
            deputy_id=member_dict.get("deputy_id", ""),
        )

    def serialize(self) -> dict:
        return {
            "member_index": self.member_index,
            "firstname": self.firstname,
            "lastname": self.lastname,
            "group": self.group,
            "role": self.role,
            "commission": self.commission,
            "circonscription": self.circonscription,
            "deputy_id": self.deputy_id,
        }
