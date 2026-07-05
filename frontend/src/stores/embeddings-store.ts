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

  async fetchVotersEmbeddings(categories?: number[]) {
    try {
      const data = await getVotersEmbeddings(categories, this.ui.activeConfigSetId);
      runInAction(() => {
        this.votersEmbedding = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  async fetchGroupsEmbeddings(categories?: number[]) {
    try {
      const data = await getGroupsEmbeddings(categories, this.ui.activeConfigSetId);
      runInAction(() => {
        this.groupsEmbedding = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }
}

export default EmbeddingsStore;
