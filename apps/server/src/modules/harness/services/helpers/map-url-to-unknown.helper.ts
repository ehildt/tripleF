import type { MediaValidationResult } from '../media-validation-cache.types.js';

/** Mark a URL as unvalidated (validation disabled or empty input). */
export function mapUrlToUnknown(url: string): MediaValidationResult {
  return { url, kind: 'unknown' };
}
