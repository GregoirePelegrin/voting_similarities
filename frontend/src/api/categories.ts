import {apiFetch} from "./client";
import {CategoryOut} from "./types";

export function getCategories(): Promise<CategoryOut[]> {
  return apiFetch("/categories");
}
