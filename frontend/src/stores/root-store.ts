import UiStore from "./ui-store";
import CategoriesStore from "./categories-store";
import QuestionsStore from "./questions-store";
import VotersStore from "./voters-store";
import GroupsStore from "./groups-store";
import EmbeddingsStore from "./embeddings-store";
import {fetchSimilarityConfig, SimilarityConfig} from "../api/config";
import {ERROR_DIALOG} from "../constants/fr";

class RootStore {
  uiStore: UiStore;
  categoriesStore: CategoriesStore;
  questionsStore: QuestionsStore;
  votersStore: VotersStore;
  groupsStore: GroupsStore;
  embeddingsStore: EmbeddingsStore;
  similarityConfig: SimilarityConfig | null = null;

  constructor() {
    this.uiStore = new UiStore();
    this.categoriesStore = new CategoriesStore(this.uiStore);
    this.questionsStore = new QuestionsStore(this.uiStore);
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
      this.similarityConfig = cfg;
    } catch {
      this.uiStore.setError(ERROR_DIALOG.API_CONNECTION);
    } finally {
      this.uiStore.setLoading(false);
    }
  }
}

const rootStore = new RootStore();
export default rootStore;
