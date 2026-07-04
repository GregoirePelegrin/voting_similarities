
from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    name: str


class VoteOut(BaseModel):
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


class VoteDetailOut(BaseModel):
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
    vote_id: int
    value: bool
    answered: bool = True
    present: bool = True
    vote_text: str | None = None
    has_passed: bool | None = None
    group_majority_yes: bool | None = None


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


class SimilarVoterOut(BaseModel):
    id: int
    firstname: str
    lastname: str
    group_color: str
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


class VoterOut(BaseModel):
    id: int
    firstname: str
    lastname: str
    group_id: int
    group_name: str
    group_color: str
    role: str | None = None
    commission: str | None = None
    circonscription: str | None = None


class VoterDetailOut(BaseModel):
    id: int
    firstname: str
    lastname: str
    group: GroupSummaryOut
    role: str | None = None
    commission: str | None = None
    circonscription: str | None = None
    answers: list[AnswerOut]
    group_yes_rates: dict[str, float] | None = None
    answer_rate: float = 0.0
    answered_count: int = 0
    present_count: int = 0
    group_avg_answer_rate: float = 0.0
    presence_rate: float = 0.0
    group_avg_presence_rate: float = 0.0
    similar_voters: list[SimilarVoterOut]
    dissimilar_voters: list[SimilarVoterOut]
    group_comparisons: list[GroupComparisonOut]


class PaginatedVotersOut(BaseModel):
    items: list[VoterOut]
    total: int
    page: int
    page_size: int


class SimilarGroupOut(BaseModel):
    id: int
    name: str
    color: str
    similarity: float
    confidence: float = 0.0
    shared_count: int = 0
    per_category: dict[str, float] | None = None


class GroupDetailOut(BaseModel):
    id: int
    name: str
    color: str
    member_count: int
    cohesivity: float
    answer_rate: float = 0.0
    answered_count: int = 0
    presence_rate: float = 0.0
    present_count: int = 0
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


class VotersEmbeddingOut(BaseModel):
    stress: float
    category_id: int | None = None
    categories_key: str | None = None
    points: list[EmbeddingPointOut]
    barycenters: list[BarycenterOut]
    shared_votes: int = 0


class GroupsEmbeddingOut(BaseModel):
    stress: float
    category_id: int | None = None
    categories_key: str | None = None
    points: list[EmbeddingPointOut]
    shared_votes: int = 0


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
