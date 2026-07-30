import { buildImageFingerprint } from './build-image-fingerprint.helper.js';
import type { ExtractedImageItem } from './extract-media-from-tools.helper.js';
import { fetchImageBuffer } from './fetch-image-buffer.helper.js';

interface DedupeImagesByFingerprintOptions {
  timeoutMs?: number;
  concurrency?: number;
}

type ImageItem = ExtractedImageItem;

/** A candidate that survived dedup, with its content fingerprint when known. */
export interface FingerprintedImageItem {
  item: ImageItem;
  fingerprint?: string;
}

interface DedupImagesResult {
  items: FingerprintedImageItem[];
  removedCount: number;
}

/**
 * Download external images and deduplicate them by SHA-256 content fingerprint.
 * Resizes each image to a consistent max dimension before hashing so that
 * CDN-resized variants of the same source image collapse to a single entry.
 *
 * Images whose fingerprint cannot be computed are kept as unique unknowns
 * rather than discarded, because they were already validated upstream. The
 * fingerprints are exposed so the shown-media registry filter can reuse them
 * without a second download pass.
 */
export async function dedupeImagesByFingerprint(
  items: ImageItem[],
  options: DedupeImagesByFingerprintOptions = {},
): Promise<DedupImagesResult> {
  const { timeoutMs = 8000, concurrency = 3 } = options;

  if (items.length === 0) return { items: [], removedCount: 0 };

  const results = new Array<FingerprintedImageItem | undefined>(items.length);
  const seenHashes = new Set<string>();
  let index = 0;

  const runNext = async (): Promise<void> => {
    const currentIndex = index++;
    if (currentIndex >= items.length) return;

    const item = items[currentIndex];
    const fingerprint = await fetchImageFingerprint(item.imageUrl, timeoutMs);

    if (fingerprint && seenHashes.has(fingerprint)) {
      results[currentIndex] = undefined;
    } else {
      if (fingerprint) seenHashes.add(fingerprint);
      results[currentIndex] = { item, fingerprint };
    }

    await runNext();
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(runNext());
  }
  await Promise.all(workers);

  const deduped = results.filter(
    (result): result is FingerprintedImageItem => result !== undefined,
  );
  return { items: deduped, removedCount: items.length - deduped.length };
}

async function fetchImageFingerprint(
  url: string,
  timeoutMs: number,
): Promise<string | undefined> {
  const buffer = await fetchImageBuffer(url, { timeoutMs });
  if (!buffer || buffer.length === 0) return undefined;

  try {
    return await buildImageFingerprint(buffer, 512);
  } catch {
    return undefined;
  }
}
