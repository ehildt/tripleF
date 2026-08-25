import { SEARCH_RETRIES, SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';

/**
 * Fetch a URL with a configurable timeout and a single retry on transient
 * failures such as AbortError / TimeoutError / network errors.
 *
 * Non-2xx HTTP responses are returned as-is and are NOT retried.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  options: { timeoutMs?: number; retries?: number } = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? SEARCH_TIMEOUT_MS;
  const retries = options.retries ?? SEARCH_RETRIES;

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isTransient =
        lastError.name === 'AbortError' ||
        lastError.name === 'TimeoutError' ||
        lastError.message.toLowerCase().includes('the operation was aborted due to timeout') ||
        lastError.message.toLowerCase().includes('fetch failed');
      if (!isTransient) throw lastError;
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
