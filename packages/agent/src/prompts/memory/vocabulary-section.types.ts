/** The scope's known taxonomy labels, grouped by tier. */
export interface TaxonomyVocabulary {
  /** Cluster tier — plural family nouns (e.g. `games`, `stocks`). */
  categories?: readonly string[];
  /** Community tier — plural sub-families (e.g. `survival-games`). */
  communities?: readonly string[];
  /** Hub tier — singular subject entities (e.g. `project zomboid`). */
  hubs?: readonly string[];
  /** Tag vocabulary — narrow recall filter labels. */
  tags?: readonly string[];
}
