import UiStore from "./ui-store";
import CategoriesStore from "./categories-store";
import QuestionsStore from "./questions-store";
import PeopleStore from "./people-store";
import GroupsStore from "./groups-store";
import EmbeddingsStore from "./embeddings-store";

class RootStore {
  ui: UiStore;
  categories: CategoriesStore;
  questions: QuestionsStore;
  people: PeopleStore;
  groups: GroupsStore;
  embeddings: EmbeddingsStore;

  constructor() {
    this.ui = new UiStore();
    this.categories = new CategoriesStore(this.ui);
    this.questions = new QuestionsStore(this.ui);
    this.people = new PeopleStore(this.ui);
    this.groups = new GroupsStore(this.ui);
    this.embeddings = new EmbeddingsStore(this.ui);
  }

  async init() {
    this.ui.setLoading(true);
    try {
      await Promise.all([
        this.categories.fetchCategories(),
        this.questions.fetchQuestions(),
      ]);
    } catch {
      this.ui.setError("Could not connect to the API. Please ensure the backend is running.");
    } finally {
      this.ui.setLoading(false);
    }
  }
}

const rootStore = new RootStore();
export default rootStore;
