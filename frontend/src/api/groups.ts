import { apiFetch } from "./client";
import { GroupListOut, GroupDetailOut, DeterminantCategoryOut } from "./types";

export function getGroups(): Promise<GroupListOut[]> {
  return apiFetch("/groups");
}

export function getGroup(
  id: number,
  category?: number | null
): Promise<GroupDetailOut> {
  const params = new URLSearchParams();
  if (category != null) params.set("category", String(category));
  const qs = params.toString();
  return apiFetch(`/groups/${id}${qs ? "?" + qs : ""}`);
}

export function getDeterminantCategories(
  groupId: number
): Promise<DeterminantCategoryOut[]> {
  return apiFetch(`/groups/${groupId}/determinant-categories`);
}
