import { isTrustedImageUrl } from '@triplef/agent/schemas';

import type { SanitizeToolResultOptions } from '../sanitize-tool-result.helper.types.js';

import { applyIngestedReplacement } from './apply-ingested-replacement.helper.js';
import { extractUrlField } from './extract-url-field.helper.js';
import { scrubThumbnailUrl } from './scrub-thumbnail-url.helper.js';

/** Sanitize one web/news search result item. */
export function sanitizeWebSearchItem(
  r: Record<string, unknown>,
  options?: SanitizeToolResultOptions,
): Record<string, unknown> {
  const withThumbnail = scrubThumbnailUrl(r, options?.brokenImageUrls);
  const imageUrl = extractUrlField(withThumbnail, 'imageUrl');
  if (!imageUrl) return withThumbnail;
  if (!isTrustedImageUrl(imageUrl) || options?.brokenImageUrls?.has(imageUrl))
    return { ...withThumbnail, imageUrl: '' };
  return applyIngestedReplacement(
    withThumbnail,
    options?.ingestedByUrl?.get(imageUrl),
  );
}
