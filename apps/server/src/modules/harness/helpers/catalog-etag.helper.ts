import { hashPayload } from '@triplef/helpers/hash-payload';

/**
 * Build a strong ETag for the models catalog payload. The hash covers the
 * full response body (models + numCtxOptions), so a 304 is only sent when
 * the entire payload is byte-identical. Quoted per the HTTP spec.
 */
export function buildCatalogEtag(payload: Record<string, unknown>): string {
  return `"${hashPayload(payload)}"`;
}
