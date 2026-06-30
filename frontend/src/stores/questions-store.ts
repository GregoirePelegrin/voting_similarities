import { makeAutoObservable, runInAction } from "mobx";
import { QuestionOut, QuestionDetailOut } from "../api/types";
import { getQuestions, getQuestion } from "../api/questions";
import UiStore from "./ui-store";
import { ERROR_DIALOG } from "../constants/fr";

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
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  async fetchQuestion(id: number) {
    try {
      const data = await getQuestion(id);
      runInAction(() => {
        this.selectedQuestion = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  clearQuestionDetail() {
    this.selectedQuestion = null;
  }
}

export default QuestionsStore;
