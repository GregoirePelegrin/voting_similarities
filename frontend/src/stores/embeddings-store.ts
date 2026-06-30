import { makeAutoObservable, runInAction } from "mobx";
import { PeopleEmbeddingOut, GroupsEmbeddingOut } from "../api/types";
import { getPeopleEmbeddings, getGroupsEmbeddings } from "../api/embeddings";
import UiStore from "./ui-store";
import { ERROR_DIALOG } from "../constants/fr";

class EmbeddingsStore {
  peopleEmbedding: PeopleEmbeddingOut | null = null;
  groupsEmbedding: GroupsEmbeddingOut | null = null;
  private ui: UiStore;

  constructor(ui: UiStore) {
    this.ui = ui;
    makeAutoObservable(this);
  }

  async fetchPeopleEmbedding(category?: number | null) {
    try {
      const data = await getPeopleEmbeddings(category);
      runInAction(() => {
        this.peopleEmbedding = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  async fetchGroupsEmbedding(category?: number | null) {
    try {
      const data = await getGroupsEmbeddings(category);
      runInAction(() => {
        this.groupsEmbedding = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }
}

export default EmbeddingsStore;
