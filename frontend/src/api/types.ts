export interface CategoryOut {
  id: number;
  name: string;
}

export interface QuestionOut {
  id: number;
  text: string;
  description: string | null;
  category_ids: number[];
}

export interface AnswerOut {
  question_id: number;
  value: boolean;
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

export interface SimilarPersonOut {
  id: number;
  name: string;
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

export interface PersonOut {
  id: number;
  name: string;
  group_id: number;
}

export interface PersonDetailOut {
  id: number;
  name: string;
  group: GroupSummaryOut;
  answers: AnswerOut[];
  similar_people: SimilarPersonOut[];
  dissimilar_people: SimilarPersonOut[];
  group_comparisons: GroupComparisonOut[];
}

export interface PaginatedPeopleOut {
  items: PersonOut[];
  total: number;
  page: number;
  page_size: number;
}

export interface SimilarGroupOut {
  id: number;
  name: string;
  color: string;
  similarity: number;
  per_category: Record<string, number> | null;
}

export interface GroupDetailOut {
  id: number;
  name: string;
  color: string;
  member_count: number;
  cohesivity: number;
  per_category: Record<string, number> | null;
  similar_groups: SimilarGroupOut[];
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

export interface PeopleEmbeddingOut {
  stress: number;
  category_id: number | null;
  points: EmbeddingPointOut[];
  barycenters: BarycenterOut[];
}

export interface GroupsEmbeddingOut {
  stress: number;
  category_id: number | null;
  points: EmbeddingPointOut[];
}
