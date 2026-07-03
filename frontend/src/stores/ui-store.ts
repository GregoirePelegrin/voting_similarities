import {makeAutoObservable} from "mobx";

export type SortMode = "value" | "name";

const LS_CATEGORIES = "voting:selectedCategories";
const LS_SORT_MODE = "voting:sortMode";

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
