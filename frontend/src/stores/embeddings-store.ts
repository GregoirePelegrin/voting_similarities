import {makeAutoObservable, runInAction} from "mobx";
import {VotersEmbeddingOut, GroupsEmbeddingOut} from "../api/types";
import {getVotersEmbeddings, getGroupsEmbeddings} from "../api/embeddings";
import UiStore from "./ui-store";
import {ERROR_DIALOG} from "../constants/fr";

class EmbeddingsStore {
  votersEmbedding: VotersEmbeddingOut | null = null;
  groupsEmbedding: GroupsEmbeddingOut | null = null;
  private ui: UiStore;

  constructor(ui: UiStore) {
    this.ui = ui;
    makeAutoObservable(this);
  }

  async fetchVotersEmbedding(category?: number | null) {
    try {
      const data = await getVotersEmbeddings(category);
      runInAction(() => {
        this.votersEmbedding = data;
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
