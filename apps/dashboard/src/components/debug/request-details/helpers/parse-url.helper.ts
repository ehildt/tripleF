import type { ParsedUrl } from './parse-url.helper.types';

/**
 * Parse an endpoint into a path and an array of query-string params.
 * Tries the URL constructor with a localhost base, then falls back to a
 * manual split.
 */
export function parseUrl(endpoint: string): ParsedUrl {
  if (!endpoint) return { path: '', params: [] };

  try {
    const url = new URL(endpoint, 'http://localhost');
    const params: Array<{ key: string; value: string }> = [];

    url.searchParams.forEach((value, key) => {
      params.push({ key, value });
    });

    return { path: url.pathname, params };
  } catch {
    // Fallback: manual parse if URL constructor fails
    const queryIndex = endpoint.indexOf('?');
    if (queryIndex === -1) {
      return { path: endpoint, params: [] };
    }

    const path = endpoint.slice(0, queryIndex);
    const queryString = endpoint.slice(queryIndex + 1);
    const params: Array<{ key: string; value: string }> = [];

    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      if (key) {
        params.push({
          key: decodeURIComponent(key),
          value: decodeURIComponent(value || ''),
        });
      }
    });

    return { path, params };
  }
}
