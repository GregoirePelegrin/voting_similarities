import { apiFetch } from "./client";
import { QuestionOut } from "./types";

export function getQuestions(): Promise<QuestionOut[]> {
  return apiFetch("/questions");
}
