import { makeAutoObservable, runInAction } from "mobx";
import { GroupListOut, GroupDetailOut } from "../api/types";
import { getGroups, getGroup } from "../api/groups";
import UiStore from "./ui-store";

class GroupsStore {
  groups: GroupListOut[] = [];
  selectedGroup: GroupDetailOut | null = null;
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
      this.ui.setError("Could not connect to the API. Please ensure the backend is running.");
    }
  }

  async fetchGroup(id: number, category?: number | null) {
    try {
      const data = await getGroup(id, category ?? undefined);
      runInAction(() => {
        this.selectedGroup = data;
      });
    } catch {
      this.ui.setError("Could not connect to the API. Please ensure the backend is running.");
    }
  }
}

export default GroupsStore;
