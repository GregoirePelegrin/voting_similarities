import {apiFetch} from "./client";
import {CategoryOut, CategoryDiscriminativenessOut} from "./types";

export function getCategories(): Promise<CategoryOut[]> {
  return apiFetch("/categories");
}

export function getCategoryDiscriminativeness(): Promise<CategoryDiscriminativenessOut[]> {
  return apiFetch("/categories/discriminativeness");
}
