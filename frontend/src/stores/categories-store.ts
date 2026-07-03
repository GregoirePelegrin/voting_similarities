import {makeAutoObservable, runInAction} from "mobx";
import {CategoryOut, CategoryDiscriminativenessOut} from "../api/types";
import {getCategories, getCategoryDiscriminativeness} from "../api/categories";
import UiStore from "./ui-store";
import {ERROR_DIALOG} from "../constants/fr";

class CategoriesStore {
  categories: CategoryOut[] = [];
  discriminativeness: CategoryDiscriminativenessOut[] = [];
  private ui: UiStore;

  constructor(ui: UiStore) {
    this.ui = ui;
    makeAutoObservable(this);
  }

  async fetchCategories() {
    try {
      const data = await getCategories();
      runInAction(() => {
        this.categories = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  async fetchDiscriminativeness() {
    try {
      const data = await getCategoryDiscriminativeness();
      runInAction(() => {
        this.discriminativeness = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }
}

export default CategoriesStore;
