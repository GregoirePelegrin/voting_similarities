import {apiFetch} from "./client";
import type {MetaOut} from "./types";

export function fetchMeta(): Promise<MetaOut> {
  return apiFetch<MetaOut>("/meta");
}