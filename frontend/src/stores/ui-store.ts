import {makeAutoObservable} from "mobx";

class UiStore {
  selectedCategory: number | null = null;
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

  setCategory(id: number | null) {
    this.selectedCategory = id;
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
