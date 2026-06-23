from typing import Optional

from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    name: str


class QuestionOut(BaseModel):
    id: int
    text: str
    description: Optional[str] = None
    category_ids: list[int]


class AnswerOut(BaseModel):
    question_id: int
    value: bool


class GroupSummaryOut(BaseModel):
    id: int
    name: str
    color: str
    member_count: int


class GroupListOut(BaseModel):
    id: int
    name: str
    color: str
    member_count: int
    cohesivity: Optional[float] = None


class SimilarPersonOut(BaseModel):
    id: int
    name: str
    similarity: float
    confidence: float
    shared_count: int


class GroupComparisonOut(BaseModel):
    group_id: int
    group_name: str
    group_color: str
    similarity: float
    confidence: float
    shared_count: int


class PersonOut(BaseModel):
    id: int
    name: str
    group_id: int


class PersonDetailOut(BaseModel):
    id: int
    name: str
    group: GroupSummaryOut
    answers: list[AnswerOut]
    similar_people: list[SimilarPersonOut]
    dissimilar_people: list[SimilarPersonOut]
    group_comparisons: list[GroupComparisonOut]


class PaginatedPeopleOut(BaseModel):
    items: list[PersonOut]
    total: int
    page: int
    page_size: int


class SimilarGroupOut(BaseModel):
    id: int
    name: str
    color: str
    similarity: float
    per_category: Optional[dict[str, float]] = None


class GroupDetailOut(BaseModel):
    id: int
    name: str
    color: str
    member_count: int
    cohesivity: float
    per_category: Optional[dict[str, float]] = None
    similar_groups: list[SimilarGroupOut]
