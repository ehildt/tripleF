/**
 * Default timeout for external search API calls.
 *
 * Search engines can be slow under load. A 3-second timeout is too aggressive
 * and causes empty result sets. 10 seconds gives reliable providers enough
 * headroom while still failing fast enough for the harness pipeline.
 */
export const SEARCH_TIMEOUT_MS = 10_000;

/**
 * Number of retries for search requests that time out or fail with a
 * transient network error.
 */
export const SEARCH_RETRIES = 1;
