import {makeAutoObservable} from "mobx";
import UiStore from "./ui-store";
import CategoriesStore from "./categories-store";
import VotesStore from "./votes-store";
import VotersStore from "./voters-store";
import GroupsStore from "./groups-store";
import EmbeddingsStore from "./embeddings-store";
import {fetchSimilarityConfig} from "../api/config";
import {ERROR_DIALOG} from "../constants/fr";

class RootStore {
  uiStore: UiStore;
  categoriesStore: CategoriesStore;
  votesStore: VotesStore;
  votersStore: VotersStore;
  groupsStore: GroupsStore;
  embeddingsStore: EmbeddingsStore;

  constructor() {
    makeAutoObservable(this);
    this.uiStore = new UiStore();
    this.categoriesStore = new CategoriesStore(this.uiStore);
    this.votesStore = new VotesStore(this.uiStore);
    this.votersStore = new VotersStore(this.uiStore);
    this.groupsStore = new GroupsStore(this.uiStore);
    this.embeddingsStore = new EmbeddingsStore(this.uiStore);
  }

  async init() {
    this.uiStore.setLoading(true);
    try {
      const [cfg] = await Promise.all([
        fetchSimilarityConfig(),
        this.categoriesStore.fetchCategories(),
      ]);
      this.uiStore.setConfigSets(cfg.sets, cfg.active_set_id);
    } catch {
      this.uiStore.setError(ERROR_DIALOG.API_CONNECTION);
    } finally {
      this.uiStore.setLoading(false);
    }
  }
}

const rootStore = new RootStore();
export default rootStore;
