import { makeAutoObservable, runInAction } from "mobx";
import { QuestionOut, QuestionDetailOut } from "../api/types";
import { getQuestions, getQuestion } from "../api/questions";
import UiStore from "./ui-store";

class QuestionsStore {
  questions: QuestionOut[] = [];
  selectedQuestion: QuestionDetailOut | null = null;
  private ui: UiStore;

  constructor(ui: UiStore) {
    this.ui = ui;
    makeAutoObservable(this);
  }

  async fetchQuestions() {
    try {
      const data = await getQuestions();
      runInAction(() => {
        this.questions = data;
      });
    } catch {
      this.ui.setError("Could not connect to the API. Please ensure the backend is running.");
    }
  }

  async fetchQuestion(id: number) {
    try {
      const data = await getQuestion(id);
      runInAction(() => {
        this.selectedQuestion = data;
      });
    } catch {
      this.ui.setError("Could not connect to the API. Please ensure the backend is running.");
    }
  }
}

export default QuestionsStore;
