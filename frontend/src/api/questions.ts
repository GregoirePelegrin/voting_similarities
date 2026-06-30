import {apiFetch} from "./client";
import {QuestionOut, QuestionDetailOut} from "./types";

export function getQuestions(): Promise<QuestionOut[]> {
  return apiFetch("/questions");
}

export function getQuestion(id: number): Promise<QuestionDetailOut> {
  return apiFetch(`/questions/${id}`);
}
