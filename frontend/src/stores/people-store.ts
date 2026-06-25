import { makeAutoObservable, runInAction } from "mobx";
import { PersonOut, PersonDetailOut, CategoryAlignmentOut } from "../api/types";
import { getPeople, getPerson, getCategoryAlignment } from "../api/people";
import UiStore from "./ui-store";

class PeopleStore {
  people: PersonOut[] = [];
  total = 0;
  groupId: number | null = null;
  selectedPerson: PersonDetailOut | null = null;
  categoryAlignment: CategoryAlignmentOut[] = [];
  private ui: UiStore;

  constructor(ui: UiStore) {
    this.ui = ui;
    makeAutoObservable(this);
  }

  async fetchPeople(groupId?: number | null) {
    try {
      if (groupId !== undefined) this.groupId = groupId;
      const data = await getPeople(1, 2000, this.groupId ?? undefined);
      runInAction(() => {
        this.people = data.items;
        this.total = data.total;
      });
    } catch {
      this.ui.setError("Could not connect to the API. Please ensure the backend is running.");
    }
  }

  async fetchPerson(id: number, category?: number | null) {
    try {
      const data = await getPerson(id, category ?? undefined);
      runInAction(() => {
        this.selectedPerson = data;
      });
    } catch {
      this.ui.setError("Could not connect to the API. Please ensure the backend is running.");
    }
  }

  async fetchCategoryAlignment(personId: number) {
    try {
      const data = await getCategoryAlignment(personId);
      runInAction(() => {
        this.categoryAlignment = data;
      });
    } catch {
      this.ui.setError("Could not connect to the API. Please ensure the backend is running.");
    }
  }
}

export default PeopleStore;
