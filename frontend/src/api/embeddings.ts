import {apiFetch} from "./client";
import {VotersEmbeddingOut, GroupsEmbeddingOut} from "./types";

function addConfigSetParam(params: URLSearchParams, configSetId?: number | null): void {
  if (configSetId != null) params.set("config_set_id", String(configSetId));
}

export function getVotersEmbeddings(
  categories?: number[],
  configSetId?: number | null,
): Promise<VotersEmbeddingOut> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    categories.forEach(c => params.append("categories", String(c)));
  }
  addConfigSetParam(params, configSetId);
  const qs = params.toString();
  return apiFetch(`/embeddings/voters${qs ? "?" + qs : ""}`);
}

export function getGroupsEmbeddings(
  categories?: number[],
  configSetId?: number | null,
): Promise<GroupsEmbeddingOut> {
  const params = new URLSearchParams();
  if (categories && categories.length > 0) {
    categories.forEach(c => params.append("categories", String(c)));
  }
  addConfigSetParam(params, configSetId);
  const qs = params.toString();
  return apiFetch(`/embeddings/groups${qs ? "?" + qs : ""}`);
}
