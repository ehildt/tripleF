import { getApiUrl } from './api-url';

/** Fetch the harness model catalog, optionally revalidating its ETag. */
export async function fetchModelsCatalog(etag?: string): Promise<Response> {
  return fetch(getApiUrl('/api/v1/harness/models'), {
    headers: etag ? { 'If-None-Match': etag } : undefined,
  });
}
