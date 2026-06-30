import {makeAutoObservable, runInAction} from "mobx";
import {CategoryOut} from "../api/types";
import {getCategories} from "../api/categories";
import UiStore from "./ui-store";
import {ERROR_DIALOG} from "../constants/fr";

class CategoriesStore {
  categories: CategoryOut[] = [];
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
}

export default CategoriesStore;
