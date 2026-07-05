import {apiFetch} from "./client";
import {CategoryOut, CategoryDiscriminativenessOut} from "./types";

export function getCategories(): Promise<CategoryOut[]> {
  return apiFetch("/categories");
}

export function getCategoryDiscriminativeness(
  configSetId?: number | null,
): Promise<CategoryDiscriminativenessOut[]> {
  const params = new URLSearchParams();
  if (configSetId != null) params.set("config_set_id", String(configSetId));
  const qs = params.toString();
  return apiFetch(`/categories/discriminativeness${qs ? "?" + qs : ""}`);
}
