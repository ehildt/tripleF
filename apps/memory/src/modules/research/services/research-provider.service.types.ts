/**
 * Boundary of the researcher's web surface: the normalized search-result
 * shape the research job consumes regardless of provider.
 */

/** One normalized search result — the gap candidate shape. */
export interface ResearchSearchResult {
  /** Result url — the dedupe/ledger key. */
  url: string;
  /** Result title, when the provider returned one. */
  title?: string;
  /** Result snippet/excerpt. */
  snippet: string;
}
