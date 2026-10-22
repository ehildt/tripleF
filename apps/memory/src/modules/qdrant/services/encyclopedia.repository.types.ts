/** Boundary of the encyclopedia collection reads: the settings listing
 * filter, the research job's gap candidates, and the dashboard drill rows.
 * Shapes mirror the stored encyclopedia chunk payload, reduced to the
 * fields each read needs. */

/** Optional tightenings of the settings encyclopedia listing. */
export interface EncyclopediaChunkFilter {
  /** Restrict to one domain (bare hostname) when set. */
  domain?: string;
  /** Restrict to one partition scope when set. */
  partitionScope?: string;
  /** Page cap (defaults apply when absent). */
  limit?: number;
}

/**
 * One candidate unfetched snippet url: a search result the user's searches
 * surfaced, with its fetch provenance. A candidate is a research gap while
 * no fetched content exists for the url.
 */
export interface EncyclopediaSnippetCandidate {
  /** The snippet url. */
  url: string;
  /** Search-result title when present. */
  title?: string;
  /** Search-result snippet text. */
  snippet: string;
  /** The user's partition the search ran under, when scoped. */
  partitionScope?: string;
}

/** One chunk row of the dashboard's label drill listing. */
export interface EncyclopediaLabelChunkRow {
  /** Chunk point id. */
  id: string;
  /** Chunk title when chunked by headings. */
  title?: string;
  /** Source url of the chunk. */
  url: string;
  /** Whether the chunk sits in the constellation link graph. */
  isLinked: boolean;
  /** Fetch timestamp (ISO string). */
  fetchedAt: string;
}
