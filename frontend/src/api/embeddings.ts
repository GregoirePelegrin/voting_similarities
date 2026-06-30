import {apiFetch} from "./client";
import {VotersEmbeddingOut, GroupsEmbeddingOut} from "./types";

export function getVotersEmbeddings(
  category?: number | null
): Promise<VotersEmbeddingOut> {
  const params = new URLSearchParams();
  if (category != null) params.set("category", String(category));
  const qs = params.toString();
  return apiFetch(`/embeddings/voters${qs ? "?" + qs : ""}`);
}

export function getGroupsEmbeddings(
  category?: number | null
): Promise<GroupsEmbeddingOut> {
  const params = new URLSearchParams();
  if (category != null) params.set("category", String(category));
  const qs = params.toString();
  return apiFetch(`/embeddings/groups${qs ? "?" + qs : ""}`);
}
