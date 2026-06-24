import { makeAutoObservable, runInAction } from "mobx";
import { QuestionOut } from "../api/types";
import { getQuestions } from "../api/questions";
import UiStore from "./ui-store";

class QuestionsStore {
  questions: QuestionOut[] = [];
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
}

export default QuestionsStore;
