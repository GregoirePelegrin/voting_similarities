import {apiFetch} from "./client";

export interface SimilarityConfig {
  w_yes: number;
  w_no: number;
  w_mismatch: number;
  m: number;
}

export function fetchSimilarityConfig(): Promise<SimilarityConfig> {
  return apiFetch<SimilarityConfig>("/config");
}
