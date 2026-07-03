import {makeAutoObservable, runInAction} from "mobx";
import {GroupListOut, GroupDetailOut, DeterminantCategoryOut, SimilarGroupOut} from "../api/types";
import {getGroups, getGroup, getDeterminantCategories} from "../api/groups";
import UiStore from "./ui-store";
import {ERROR_DIALOG} from "../constants/fr";

class GroupsStore {
  groups: GroupListOut[] = [];
  selectedGroup: GroupDetailOut | null = null;
  determinantCategories: DeterminantCategoryOut[] = [];
  heatmapSimilarGroups: SimilarGroupOut[] = [];
  private ui: UiStore;

  constructor(ui: UiStore) {
    this.ui = ui;
    makeAutoObservable(this);
  }

  async fetchGroups() {
    try {
      const data = await getGroups();
      runInAction(() => {
        this.groups = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  async fetchGroup(id: number, categories?: number[]) {
    try {
      const data = await getGroup(id, categories);
      runInAction(() => {
        this.selectedGroup = data;
        if (!categories || categories.length === 0) {
          this.heatmapSimilarGroups = data.similar_groups;
        }
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  async fetchDeterminantCategories(groupId: number) {
    try {
      const data = await getDeterminantCategories(groupId);
      runInAction(() => {
        this.determinantCategories = data;
      });
    } catch {
      this.ui.setError(ERROR_DIALOG.API_CONNECTION);
    }
  }

  clearGroupDetail() {
    this.selectedGroup = null;
    this.heatmapSimilarGroups = [];
    this.determinantCategories = [];
  }
}

export default GroupsStore;
