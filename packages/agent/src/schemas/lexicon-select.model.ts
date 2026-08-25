/**
 * Ephemeral retrieval-selection contract shared by the server harness and the
 * memory app's lexicon/select endpoint. Plain interfaces (no zod) — mirrors
 * how `memory-cognition.model.ts` lives in this package: the wire shape is
 * validated by the memory app's DTO, not by a schema here.
 */

/** One fetched source body offered for selection. */
export interface LexiconSourceDocument {
  url?: string;
  title?: string;
  content: string;
}

/** One verbatim passage selected from a source, with its retrieval score. */
export interface LexiconSelectedChunk {
  url?: string;
  title?: string;
  content: string;
  score: number;
  /**
   * `content` = a chunk of a fetched document; `result` = a search-result
   * snippet (Tier-1 index — not full text). Absent for ephemeral selections.
   */
  sourceType?: 'content' | 'result';
}

/** One search result to index as a Tier-1 snippet (no page fetch). */
export interface LexiconSearchResult {
  url: string;
  title?: string;
  snippet: string;
}

/** Request body for `POST /api/v1/lexicon/select`. */
export interface LexiconSelectInput {
  query: string;
  documents: LexiconSourceDocument[];
  /**
   * Search results seen this turn — indexed as cheap Tier-1 snippet points so
   * the lexicon remembers every source touched, not just the fetched pages.
   */
  searchResults?: LexiconSearchResult[];
  /** Selection budget in chars; undefined → server-side default (LEXICON_BUDGET_CHARS). */
  budgetChars?: number;
  /**
   * Partition that fetched the documents — recorded as provenance on stored
   * chunks (the lexicon itself is global). Undefined → 'global'.
   */
  partitionScope?: string;
}

/** Selection outcome: ranked verbatim chunks plus honest accounting. */
export interface LexiconSelectResult {
  chunks: LexiconSelectedChunk[];
  consideredChunks: number;
  selectedChunks: number;
  droppedByThreshold: number;
  /** Chunks never scored because LEXICON_MAX_CHUNKS rounded off the tail (round-robin across docs). */
  inputChunksDropped: number;
  /**
   * Global probe hits from previously persisted sources (neighbor-expanded,
   * deduped against `chunks`). Absent when persistence is disabled or the
   * probe found nothing. The harness injects these as a separate context
   * block — they never share the current-turn selection budget.
   */
  pastChunks?: LexiconSelectedChunk[];
  /** Documents whose stored content hash matched — reused without re-embedding. */
  reusedDocs?: number;
  /** Documents newly persisted this call. */
  storedDocs?: number;
}
