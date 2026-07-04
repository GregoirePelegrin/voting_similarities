export interface CategoryOut {
  id: number;
  name: string;
}

export interface VoteOut {
  id: number;
  text: string;
  description: string | null;
  has_passed: boolean;
  category_ids: number[];
}

export interface GroupAnswerStatsOut {
  group_id: number;
  group_name: string;
  group_color: string;
  yes_count: number;
  no_count: number;
  missing_count: number;
  yes_rate: number;
}

export interface VoteDetailOut {
  id: number;
  text: string;
  description: string | null;
  has_passed: boolean;
  category_ids: number[];
  category_names: string[];
  total_yes: number;
  total_no: number;
  total_missing: number;
  group_stats: GroupAnswerStatsOut[];
}

export interface AnswerOut {
  vote_id: number;
  value: boolean;
  answered: boolean;
  present: boolean;
  vote_text: string | null;
  has_passed: boolean | null;
  group_majority_yes: boolean | null;
}

export interface GroupSummaryOut {
  id: number;
  name: string;
  color: string;
  member_count: number;
}

export interface GroupListOut {
  id: number;
  name: string;
  color: string;
  member_count: number;
  cohesivity: number | null;
}

export interface SimilarVoterOut {
  id: number;
  firstname: string;
  lastname: string;
  group_color: string;
  similarity: number;
  confidence: number;
  shared_count: number;
}

export interface GroupComparisonOut {
  group_id: number;
  group_name: string;
  group_color: string;
  similarity: number;
  confidence: number;
  shared_count: number;
}

export interface VoterOut {
  id: number;
  firstname: string;
  lastname: string;
  group_id: number;
  group_name: string;
  group_color: string;
  role: string | null;
  commission: string | null;
  circonscription: string | null;
}

export interface VoterDetailOut {
  id: number;
  firstname: string;
  lastname: string;
  group: GroupSummaryOut;
  role: string | null;
  commission: string | null;
  circonscription: string | null;
  answers: AnswerOut[];
  group_yes_rates: Record<string, number> | null;
  answer_rate: number;
  answered_count: number;
  present_count: number;
  group_avg_answer_rate: number;
  presence_rate: number;
  group_avg_presence_rate: number;
  similar_voters: SimilarVoterOut[];
  dissimilar_voters: SimilarVoterOut[];
  group_comparisons: GroupComparisonOut[];
  total_votes: number;
}

export interface PaginatedVotersOut {
  items: VoterOut[];
  total: number;
  page: number;
  page_size: number;
}

export interface SimilarGroupOut {
  id: number;
  name: string;
  color: string;
  similarity: number;
  confidence?: number;
  shared_count?: number;
  per_category: Record<string, number> | null;
}

export interface GroupDetailOut {
  id: number;
  name: string;
  color: string;
  member_count: number;
  cohesivity: number;
  answer_rate: number;
  answered_count: number;
  presence_rate: number;
  present_count: number;
  per_category: Record<string, number> | null;
  similar_groups: SimilarGroupOut[];
  total_votes: number;
}

export interface EmbeddingPointOut {
  id: number;
  name: string;
  group_id?: number;
  group_name?: string;
  group_color?: string;
  color: string;
  x: number;
  y: number;
}

export interface BarycenterOut {
  group_id: number;
  name: string;
  color: string;
  member_count: number;
  x: number;
  y: number;
}

export interface VotersEmbeddingOut {
  stress: number;
  category_id: number | null;
  categories_key: string | null;
  points: EmbeddingPointOut[];
  barycenters: BarycenterOut[];
  shared_votes?: number;
}

export interface GroupsEmbeddingOut {
  stress: number;
  category_id: number | null;
  categories_key: string | null;
  points: EmbeddingPointOut[];
  shared_votes?: number;
}

export interface GroupBreakdownOut {
  accuracy: number;
  most_confused_with: number | null;
  most_confused_similarity: number | null;
  kl_divergence: number;
}

export interface CategoryDiscriminativenessOut {
  category_id: number;
  category_name: string;
  info_gain: number;
  normalized_ig: number;
  variance_score: number;
  per_group_breakdown: Record<string, GroupBreakdownOut> | null;
}

export interface DeterminantCategoryOut {
  category_id: number;
  category_name: string;
  info_gain: number;
  normalized_ig: number;
  accuracy: number;
  most_confused_with_id: number | null;
  most_confused_with_name: string | null;
  most_confused_similarity: number | null;
  kl_divergence: number;
}

export interface CategoryAlignmentOut {
  category_id: number;
  category_name: string;
  own_group_similarity: number;
  avg_other_group_similarity: number;
  alignment: number;
}
