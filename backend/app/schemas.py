
from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    name: str


class QuestionOut(BaseModel):
    id: int
    text: str
    description: str | None = None
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
    cohesivity: float | None = None


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
    per_category: dict[str, float] | None = None


class GroupDetailOut(BaseModel):
    id: int
    name: str
    color: str
    member_count: int
    cohesivity: float
    per_category: dict[str, float] | None = None
    similar_groups: list[SimilarGroupOut]


class EmbeddingPointOut(BaseModel):
    id: int
    name: str
    group_id: int | None = None
    group_name: str | None = None
    group_color: str | None = None
    color: str
    x: float
    y: float


class BarycenterOut(BaseModel):
    group_id: int
    name: str
    color: str
    member_count: int
    x: float
    y: float


class PeopleEmbeddingOut(BaseModel):
    stress: float
    category_id: int | None = None
    points: list[EmbeddingPointOut]
    barycenters: list[BarycenterOut]


class GroupsEmbeddingOut(BaseModel):
    stress: float
    category_id: int | None = None
    points: list[EmbeddingPointOut]
