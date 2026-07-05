import {apiFetch} from "./client";
import {GroupListOut, GroupDetailOut, DeterminantCategoryOut} from "./types";

function addConfigSetParam(params: URLSearchParams, configSetId?: number | null): void {
  if (configSetId != null) params.set("config_set_id", String(configSetId));
}

export function getGroups(): Promise<GroupListOut[]> {
  return apiFetch("/groups");
}

export function getGroup(
  id: number,
  categories?: number[],
  configSetId?: number | null,
): Promise<GroupDetailOut> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    categories.forEach(c => params.append("categories", String(c)));
  }
  addConfigSetParam(params, configSetId);
  const qs = params.toString();
  return apiFetch(`/groups/${id}${qs ? "?" + qs : ""}`);
}

export function getDeterminantCategories(
  groupId: number,
  configSetId?: number | null,
): Promise<DeterminantCategoryOut[]> {
  const params = new URLSearchParams();
  addConfigSetParam(params, configSetId);
  const qs = params.toString();
  return apiFetch(`/groups/${groupId}/determinant-categories${qs ? "?" + qs : ""}`);
}
