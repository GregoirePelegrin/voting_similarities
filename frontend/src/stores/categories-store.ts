import { makeAutoObservable, runInAction } from "mobx";
import { CategoryOut } from "../api/types";
import { getCategories } from "../api/categories";
import UiStore from "./ui-store";

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
      this.ui.setError("Could not connect to the API. Please ensure the backend is running.");
    }
  }
}

export default CategoriesStore;
