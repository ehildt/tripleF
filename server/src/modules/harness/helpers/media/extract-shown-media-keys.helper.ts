import { videoUrlKeys } from '../url-trust/video-url-keys.helper.js';

import type {
  ExtractedShownMediaKeys,
  ShownMediaKeySourceOptions,
} from './extract-shown-media-keys.types.js';
import { extractStorageHash } from './extract-storage-hash.helper.js';

/** Registry key prefixes: image identity by content fingerprint or storage hash. */
export const IMAGE_FINGERPRINT_PREFIX = 'fp:';
export const IMAGE_STORAGE_HASH_PREFIX = 'sh:';

const STORAGE_URL_PREFIX = '/api/v1/storage/';

function collectStrings(value: unknown, key: string, urls: Set<string>): void {
  if (typeof value === 'string') return;
  if (Array.isArray(value)) {
    for (const entry of value) collectStrings(entry, key, urls);
    return;
  }
  if (value === null || typeof value !== 'object') return;

  for (const [childKey, childValue] of Object.entries(value)) {
    if (childKey === key && typeof childValue === 'string' && childValue) {
      urls.add(childValue);
    } else {
      collectStrings(childValue, key, urls);
    }
  }
}

function collectByKeys(
  data: Record<string, unknown>,
  keys: string[],
): Set<string> {
  const urls = new Set<string>();
  for (const key of keys) collectStrings(data, key, urls);
  return urls;
}

/**
 * Derive the shown-media registry keys from a guarded response payload:
 * every rendered cloud image (hero, galleries, related-story thumbnails,
 * shop-offer images) and every rendered video. User uploads are excluded —
 * they belong to the user, not to search results.
 *
 * Images from this turn resolve to their normalized content fingerprint
 * (`fp:`), images referenced from earlier turns fall back to their storage
 * hash (`sh:`) — both compare deterministically against later candidates.
 */
export function extractShownMediaKeys(
  data: Record<string, unknown> | undefined,
  opts: ShownMediaKeySourceOptions,
): ExtractedShownMediaKeys {
  if (!data) return { imageKeys: [], videoKeys: [] };

  const imageUrls = collectByKeys(data, ['heroImageUrl', 'imageUrl']);
  const videoUrls = collectByKeys(data, ['heroVideoUrl', 'videoUrl']);

  const imageKeys = new Set<string>();
  for (const url of imageUrls) {
    if (!url.startsWith(STORAGE_URL_PREFIX)) continue;
    if (opts.localImageUrls.has(url)) continue;

    const fingerprint = opts.fingerprintByStorageUrl.get(url);
    if (fingerprint) {
      imageKeys.add(IMAGE_FINGERPRINT_PREFIX + fingerprint);
      continue;
    }

    const hash = extractStorageHash(url);
    if (hash) imageKeys.add(IMAGE_STORAGE_HASH_PREFIX + hash);
  }

  const videoKeys = new Set<string>();
  for (const url of videoUrls) {
    for (const key of videoUrlKeys(url)) videoKeys.add(key);
  }

  return { imageKeys: [...imageKeys], videoKeys: [...videoKeys] };
}
