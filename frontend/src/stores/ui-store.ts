import {makeAutoObservable} from "mobx";
import type {ConfigSetOut} from "../api/types";

export type SortMode = "value" | "name";

const LS_CATEGORIES = "voting:selectedCategories";
const LS_SORT_MODE = "voting:sortMode";
const LS_CONFIG_SET = "voting:activeConfigSetId";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

class UiStore {
  selectedCategories: number[] = loadJSON<number[]>(LS_CATEGORIES, []);
  sortMode: SortMode = loadJSON<SortMode>(LS_SORT_MODE, "value");
  configSets: ConfigSetOut[] = [];
  activeConfigSetId: number | null = loadJSON<number | null>(LS_CONFIG_SET, null);
  loading = false;
  error: string | null = null;
  retryVersion = 0;
  snackbar: { open: boolean; message: string; severity: "success" | "error" | "info" } = {
    open: false,
    message: "",
    severity: "info",
  };

  constructor() {
    makeAutoObservable(this);
  }

  setCategories(ids: number[]) {
    if (ids.length > 3) return;
    this.selectedCategories = ids;
    localStorage.setItem(LS_CATEGORIES, JSON.stringify(ids));
  }

  get categoriesKey(): string | null {
    if (this.selectedCategories.length === 0) return null;
    return [...this.selectedCategories].sort((a, b) => a - b).join("_");
  }

  setConfigSets(sets: ConfigSetOut[], activeId: number | null) {
    this.configSets = sets;
    if (this.activeConfigSetId == null && activeId != null) {
      this.activeConfigSetId = activeId;
      localStorage.setItem(LS_CONFIG_SET, JSON.stringify(activeId));
    }
  }

  get activeConfigSet(): ConfigSetOut | undefined {
    return this.configSets.find(s => s.id === this.activeConfigSetId);
  }

  setActiveConfigSetId(id: number) {
    this.activeConfigSetId = id;
    localStorage.setItem(LS_CONFIG_SET, JSON.stringify(id));
    // Force a refetch of all data by incrementing retry version
    this.incrementRetry();
  }

  setSortMode(mode: SortMode) {
    this.sortMode = mode;
    localStorage.setItem(LS_SORT_MODE, JSON.stringify(mode));
  }

  setLoading(v: boolean) {
    this.loading = v;
  }

  setError(msg: string) {
    this.error = msg;
  }

  clearError() {
    this.error = null;
  }

  incrementRetry() {
    this.retryVersion += 1;
  }

  showSnackbar(message: string, severity: "success" | "error" | "info" = "info") {
    this.snackbar = {open: true, message, severity};
  }

  closeSnackbar() {
    this.snackbar.open = false;
  }
}

export default UiStore;
