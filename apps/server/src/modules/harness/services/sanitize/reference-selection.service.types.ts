interface ReferenceSelectionSummary {
  /** Number of candidate chunks considered by the selector. */
  considered: number;
  /** Number of candidate chunks selected for the response context. */
  selected: number;
}

interface EncyclopediaPassage {
  /** Source URL of the passage, when known. */
  url?: string;
  /** Source title of the passage, when known. */
  title?: string;
  /** Verbatim passage content. */
  content: string;
  /** Whether the passage came from fetched content or a search snippet. */
  sourceType?: 'content' | 'result';
}

export interface SanitizeReferenceSelectionResult {
  /** Normalized current-turn references after selection or fallback. */
  references: Array<Record<string, unknown>>;
  /** Selection accounting, omitted when the memory selector was not used. */
  selection?: ReferenceSelectionSummary;
  /** Relevant passages recalled from previously persisted encyclopedia sources. */
  encyclopediaPassages?: EncyclopediaPassage[];
}
