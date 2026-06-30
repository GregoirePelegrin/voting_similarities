import {apiFetch} from "./client";
import {PeopleEmbeddingOut, GroupsEmbeddingOut} from "./types";

export function getPeopleEmbeddings(
  category?: number | null
): Promise<PeopleEmbeddingOut> {
  const params = new URLSearchParams();
  if (category != null) params.set("category", String(category));
  const qs = params.toString();
  return apiFetch(`/embeddings/people${qs ? "?" + qs : ""}`);
}

export function getGroupsEmbeddings(
  category?: number | null
): Promise<GroupsEmbeddingOut> {
  const params = new URLSearchParams();
  if (category != null) params.set("category", String(category));
  const qs = params.toString();
  return apiFetch(`/embeddings/groups${qs ? "?" + qs : ""}`);
}
