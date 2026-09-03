/**
 * Agentic encyclopedia document-read contract shared by the server harness
 * (the encyclopedia-read tool) and the memory app's `encyclopedia/document`
 * endpoint. Plain interfaces (no zod) — mirrors `encyclopedia-select.model.ts`:
 * the wire shape is validated by the memory app's DTO, not by a schema here.
 */

/** Request body for `POST /api/v1/encyclopedia/document`. */
export interface EncyclopediaDocumentInput {
  /** Exact url of the document (from an encyclopedia-search hit). */
  url: string;
  /** Chunk index to start reading from (default 0) — the continuation knob. */
  offset?: number;
  /** Max chars of the returned window (defaults + caps server-side). */
  maxChars?: number;
}

/**
 * One window into a stored document: the verbatim, overlap-stripped content
 * of chunks `fromChunk`…`toChunk`, in original order. `hasMore` plus
 * `toChunk + 1` as the next `offset` is the iterative deep-dive loop.
 */
export interface EncyclopediaDocumentResult {
  url: string;
  title?: string;
  domain: string;
  /** Total chunks of the document. */
  totalChunks: number;
  /** First chunk index of this window. */
  fromChunk: number;
  /** Last chunk index of this window (inclusive). */
  toChunk: number;
  /** True when the document continues past `toChunk`. */
  hasMore: boolean;
  /** The verbatim merged content of the window. */
  content: string;
}
