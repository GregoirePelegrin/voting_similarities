import {apiFetch} from "./client";
import {PaginatedVotersOut, VoterDetailOut, CategoryAlignmentOut} from "./types";

export function getVoters(
  page: number,
  pageSize: number,
  groupId?: number
): Promise<PaginatedVotersOut> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (groupId != null) params.set("group_id", String(groupId));
  return apiFetch(`/voters?${params}`);
}

export function getVoter(
  id: number,
  categories?: number[]
): Promise<VoterDetailOut> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    categories.forEach(c => params.append("categories", String(c)));
  }
  const qs = params.toString();
  return apiFetch(`/voters/${id}${qs ? "?" + qs : ""}`);
}

export function getCategoryAlignment(
  voterId: number
): Promise<CategoryAlignmentOut[]> {
  return apiFetch(`/voters/${voterId}/category-alignment`);
}
