/**
 * Ephemeral retrieval-selection contract shared by the server harness and the
 * memory app's encyclopedia/select endpoint. Plain interfaces (no zod) —
 * mirrors how `memory-cognition.model.ts` lives in this package: the wire
 * shape is validated by the memory app's DTO, not by a schema here.
 */

/** One fetched source body offered for selection. */
export interface EncyclopediaSourceDocument {
  url?: string;
  title?: string;
  content: string;
  /**
   * Mime type of the original upload (e.g. `application/pdf`) — uploaded
   * documents only; absent for fetched web pages.
   */
  mimeType?: string;
  /** Byte size of the original upload — uploaded documents only. */
  sizeBytes?: number;
  /**
   * Content hash of the ORIGINAL upload (the MinIO object identity) —
   * distinct from the extracted-text content hash; uploaded documents only.
   */
  originalHash?: string;
}

/** One verbatim passage selected from a source, with its retrieval score. */
export interface EncyclopediaSelectedChunk {
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
export interface EncyclopediaSearchResult {
  url: string;
  title?: string;
  snippet: string;
}

/** Request body for `POST /api/v1/encyclopedia/select`. */
export interface EncyclopediaSelectInput {
  query: string;
  documents: EncyclopediaSourceDocument[];
  /**
   * Search results seen this turn — indexed as cheap Tier-1 snippet points so
   * the encyclopedia remembers every source touched, not just the fetched
   * pages.
   */
  searchResults?: EncyclopediaSearchResult[];
  /** Selection budget in chars; undefined → server-side default (ENCYCLOPEDIA_BUDGET_CHARS). */
  budgetChars?: number;
  /**
   * Partition that fetched the documents — recorded as provenance on stored
   * chunks (the encyclopedia itself is global). Undefined → 'global'.
   */
  partitionScope?: string;
  /**
   * The turn's chat model — threaded to the classification job when the
   * select call crosses the classify threshold, so classification can run
   * without a dedicated ENCYCLOPEDIA_CLASSIFY_MODEL. Optional.
   */
  model?: string;
}

/** Selection outcome: ranked verbatim chunks plus honest accounting. */
export interface EncyclopediaSelectResult {
  chunks: EncyclopediaSelectedChunk[];
  consideredChunks: number;
  selectedChunks: number;
  droppedByThreshold: number;
  /** Chunks never scored because ENCYCLOPEDIA_MAX_CHUNKS rounded off the tail (round-robin across docs). */
  inputChunksDropped: number;
  /**
   * Global probe hits from previously persisted sources (neighbor-expanded,
   * deduped against `chunks`). Absent when persistence is disabled or the
   * probe found nothing. The harness injects these as a separate context
   * block — they never share the current-turn selection budget.
   */
  pastChunks?: EncyclopediaSelectedChunk[];
  /** Documents whose stored content hash matched — reused without re-embedding. */
  reusedDocs?: number;
  /** Documents newly persisted this call. */
  storedDocs?: number;
}
