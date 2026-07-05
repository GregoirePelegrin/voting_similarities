import {apiFetch} from "./client";
import {PaginatedVotersOut, VoterDetailOut, CategoryAlignmentOut} from "./types";

function addConfigSetParam(params: URLSearchParams, configSetId?: number | null): void {
  if (configSetId != null) params.set("config_set_id", String(configSetId));
}

export function getVoters(
  page: number,
  pageSize: number,
  groupId?: number,
  configSetId?: number | null,
): Promise<PaginatedVotersOut> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (groupId != null) params.set("group_id", String(groupId));
  addConfigSetParam(params, configSetId);
  return apiFetch(`/voters?${params}`);
}

export function getVoter(
  id: number,
  categories?: number[],
  configSetId?: number | null,
): Promise<VoterDetailOut> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    categories.forEach(c => params.append("categories", String(c)));
  }
  addConfigSetParam(params, configSetId);
  const qs = params.toString();
  return apiFetch(`/voters/${id}${qs ? "?" + qs : ""}`);
}

export function getCategoryAlignment(
  voterId: number,
  configSetId?: number | null,
): Promise<CategoryAlignmentOut[]> {
  const params = new URLSearchParams();
  addConfigSetParam(params, configSetId);
  const qs = params.toString();
  return apiFetch(`/voters/${voterId}/category-alignment${qs ? "?" + qs : ""}`);
}
