import {apiFetch} from "./client";
import {GroupListOut, GroupDetailOut, DeterminantCategoryOut} from "./types";

export function getGroups(): Promise<GroupListOut[]> {
  return apiFetch("/groups");
}

export function getGroup(
  id: number,
  categories?: number[]
): Promise<GroupDetailOut> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    categories.forEach(c => params.append("categories", String(c)));
  }
  const qs = params.toString();
  return apiFetch(`/groups/${id}${qs ? "?" + qs : ""}`);
}

export function getDeterminantCategories(
  groupId: number
): Promise<DeterminantCategoryOut[]> {
  return apiFetch(`/groups/${groupId}/determinant-categories`);
}
