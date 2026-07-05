import {apiFetch} from "./client";
import type {ConfigResponse} from "./types";

export interface SimilarityConfig {
  w_yes: number;
  w_no: number;
  w_mismatch: number;
  m: number;
}

export function fetchSimilarityConfig(): Promise<ConfigResponse> {
  return apiFetch<ConfigResponse>("/config");
}

export function fetchConfigSets(): Promise<ConfigResponse["sets"]> {
  return apiFetch<ConfigResponse["sets"]>("/config/sets");
}
