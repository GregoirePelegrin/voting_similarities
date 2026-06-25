
from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    name: str


class QuestionOut(BaseModel):
    id: int
    text: str
    description: str | None = None
    has_passed: bool
    category_ids: list[int]


class GroupAnswerStatsOut(BaseModel):
    group_id: int
    group_name: str
    group_color: str
    yes_count: int
    no_count: int
    missing_count: int
    yes_rate: float


class QuestionDetailOut(BaseModel):
    id: int
    text: str
    description: str | None = None
    has_passed: bool
    category_ids: list[int]
    category_names: list[str]
    total_yes: int
    total_no: int
    total_missing: int
    group_stats: list[GroupAnswerStatsOut]


class AnswerOut(BaseModel):
    question_id: int
    value: bool
    answered: bool = True
    question_text: str | None = None
    has_passed: bool | None = None


class RoleOut(BaseModel):
    id: int
    name: str


class CommissionOut(BaseModel):
    id: int
    name: str


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
    firstname: str
    lastname: str
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
    firstname: str
    lastname: str
    group_id: int
    group_name: str
    group_color: str
    role: str | None = None
    commission: str | None = None
    circonscription: str | None = None


class PersonDetailOut(BaseModel):
    id: int
    firstname: str
    lastname: str
    group: GroupSummaryOut
    role: str | None = None
    commission: str | None = None
    circonscription: str | None = None
    answers: list[AnswerOut]
    group_yes_rates: dict[str, float] | None = None
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


class GroupBreakdownOut(BaseModel):
    accuracy: float
    most_confused_with: int | None = None
    most_confused_similarity: float | None = None
    kl_divergence: float


class CategoryDiscriminativenessOut(BaseModel):
    category_id: int
    category_name: str
    info_gain: float
    normalized_ig: float
    variance_score: float
    per_group_breakdown: dict[str, GroupBreakdownOut] | None = None


class DeterminantCategoryOut(BaseModel):
    category_id: int
    category_name: str
    info_gain: float
    normalized_ig: float
    accuracy: float
    most_confused_with_id: int | None = None
    most_confused_with_name: str | None = None
    most_confused_similarity: float | None = None
    kl_divergence: float


class CategoryAlignmentOut(BaseModel):
    category_id: int
    category_name: str
    own_group_similarity: float
    avg_other_group_similarity: float
    alignment: float
