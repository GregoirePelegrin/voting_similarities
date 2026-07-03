import {apiFetch} from "./client";
import {VotersEmbeddingOut, GroupsEmbeddingOut} from "./types";

export function getVotersEmbeddings(
  categories?: number[]
): Promise<VotersEmbeddingOut> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    categories.forEach(c => params.append("categories", String(c)));
  }
  const qs = params.toString();
  return apiFetch(`/embeddings/voters${qs ? "?" + qs : ""}`);
}

export function getGroupsEmbeddings(
  categories?: number[]
): Promise<GroupsEmbeddingOut> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    categories.forEach(c => params.append("categories", String(c)));
  }
  const qs = params.toString();
  return apiFetch(`/embeddings/groups${qs ? "?" + qs : ""}`);
}
