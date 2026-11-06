export interface MemoryVocabularyResult {
  /** Distinct category labels available in the requested partition. */
  categories: string[];
  /** Distinct tag labels available in the requested partition. */
  tags: string[];
}
