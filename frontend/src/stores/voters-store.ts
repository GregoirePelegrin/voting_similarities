import {makeAutoObservable, runInAction} from "mobx";
import {VoterOut, VoterDetailOut, CategoryAlignmentOut} from "../api/types";
import {getVoters, getVoter, getCategoryAlignment} from "../api/voters";
import UiStore from "./ui-store";
import {ERROR_DIALOG} from "../constants/fr";

class VotersStore {
  voters: VoterOut[] = [];
  total = 0;
  groupId: number | null = null;
  selectedVoter: VoterDetailOut | null = null;
  categoryAlignment: CategoryAlignmentOut[] = [];
  private ui: UiStore;

  constructor(ui: UiStore) {
    this.ui = ui;
    makeAutoObservable(this);
  }

  async fetchVoters(groupId?: number | null) {
    try {
      if (groupId !== undefined) this.groupId = groupId;
      const data = await getVoters(1, 2000, this.groupId ?? undefined);
      runInAction(() => {
        this.voters = data.items;
        this.total = data.total;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  async fetchVoter(id: number, categories?: number[]) {
    try {
      const data = await getVoter(id, categories);
      runInAction(() => {
        this.selectedVoter = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  async fetchCategoryAlignment(voterId: number) {
    try {
      const data = await getCategoryAlignment(voterId);
      runInAction(() => {
        this.categoryAlignment = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  clearVoterDetail() {
    this.selectedVoter = null;
    this.categoryAlignment = [];
  }
}

export default VotersStore;
