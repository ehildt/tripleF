import type { ShownMediaKeys } from '../../services/shown-media.service.types.js';

import { extractObjectStorageHash } from './extract-object-storage-hash.helper.js';
import {
  IMAGE_FINGERPRINT_PREFIX,
  IMAGE_STORAGE_HASH_PREFIX,
} from './extract-shown-media-keys.constants.js';

/**
 * Whether an image candidate was already shown: by content fingerprint
 * (pre-ingest candidates, freshly ingested images) or by storage hash
 * (references to objects ingested in earlier turns).
 */
export function isShownImage(
  keys: ShownMediaKeys,
  opts: { fingerprint?: string; storageUrl?: string },
): boolean {
  if (
    opts.fingerprint &&
    keys.images.has(IMAGE_FINGERPRINT_PREFIX + opts.fingerprint)
  ) {
    return true;
  }

  if (!opts.storageUrl) return false;
  const hash = extractObjectStorageHash(opts.storageUrl);
  return (
    hash !== undefined && keys.images.has(IMAGE_STORAGE_HASH_PREFIX + hash)
  );
}
