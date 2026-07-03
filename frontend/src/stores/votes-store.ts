import {makeAutoObservable, runInAction} from "mobx";
import {VoteOut, VoteDetailOut} from "../api/types";
import {getVotes, getVote} from "../api/votes";
import UiStore from "./ui-store";
import {ERROR_DIALOG} from "../constants/fr";

class VotesStore {
  votes: VoteOut[] = [];
  selectedVote: VoteDetailOut | null = null;
  private ui: UiStore;

  constructor(ui: UiStore) {
    this.ui = ui;
    makeAutoObservable(this);
  }

  async fetchVotes() {
    try {
      const data = await getVotes();
      runInAction(() => {
        this.votes = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  async fetchVote(id: number) {
    try {
      const data = await getVote(id);
      runInAction(() => {
        this.selectedVote = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  clearVoteDetail() {
    this.selectedVote = null;
  }
}

export default VotesStore;
