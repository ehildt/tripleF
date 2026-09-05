/**
 * Agentic encyclopedia-search contract shared by the server harness (the
 * encyclopedia-search tool) and the memory app's `encyclopedia/search`
 * endpoint. Plain interfaces (no zod) — mirrors `encyclopedia-select.model.ts`:
 * the wire shape is validated by the memory app's DTO, not by a schema here.
 */

/** Request body for `POST /api/v1/encyclopedia/search`. */
export interface EncyclopediaSearchInput {
  /** Natural-language question or keywords to search the knowledge base for. */
  query: string;
  /** Scope the search to ONE document — the exact url of a known source. */
  url?: string;
  /** Scope the search to one source domain (e.g. `reddit.com`). */
  domain?: string;
  /** Max hits returned (defaults server-side, capped). */
  limit?: number;
}

/**
 * One knowledge-base hit: a verbatim chunk of a fetched page or an uploaded
 * document, with the coordinates the encyclopedia-read tool needs to pull
 * more of the same document.
 */
export interface EncyclopediaSearchHit {
  /** Source identity — uploads carry their storage url (open/download link). */
  url: string;
  title?: string;
  domain: string;
  /** The verbatim passage text. */
  content: string;
  /** Cosine similarity to the query. */
  score: number;
  /** Position inside the document (0-based) — the continuation coordinate. */
  chunkIndex: number;
  /** Total chunks of the document. */
  chunkCount: number;
  /** `content` = full-text document chunk; `result` = search-result snippet (Tier-1, not full text). */
  sourceType: 'content' | 'result';
  /** When the source was fetched/indexed — the freshness signal. */
  fetchedAt: string;
}
