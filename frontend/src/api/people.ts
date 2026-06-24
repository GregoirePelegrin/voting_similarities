import { apiFetch } from "./client";
import { PaginatedPeopleOut, PersonDetailOut, CategoryAlignmentOut } from "./types";

export function getPeople(
  page: number,
  pageSize: number,
  groupId?: number
): Promise<PaginatedPeopleOut> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (groupId != null) params.set("group_id", String(groupId));
  return apiFetch(`/people?${params}`);
}

export function getPerson(
  id: number,
  category?: number | null
): Promise<PersonDetailOut> {
  const params = new URLSearchParams();
  if (category != null) params.set("category", String(category));
  const qs = params.toString();
  return apiFetch(`/people/${id}${qs ? "?" + qs : ""}`);
}

export function getCategoryAlignment(
  personId: number
): Promise<CategoryAlignmentOut[]> {
  return apiFetch(`/people/${personId}/category-alignment`);
}
