import { buildImageFingerprint } from './build-image-fingerprint.helper.js';
import type { ExtractedImageItem } from './extract-media-from-tools.helper.js';

interface DedupeImagesByFingerprintOptions {
  timeoutMs?: number;
  concurrency?: number;
}

type ImageItem = ExtractedImageItem;

interface DedupImagesResult {
  items: ImageItem[];
  removedCount: number;
}

/**
 * Download external images and deduplicate them by SHA-256 content fingerprint.
 * Resizes each image to a consistent max dimension before hashing so that
 * CDN-resized variants of the same source image collapse to a single entry.
 *
 * Images whose fingerprint cannot be computed are kept as unique unknowns
 * rather than discarded, because they were already validated upstream.
 */
export async function dedupeImagesByFingerprint(
  items: ImageItem[],
  options: DedupeImagesByFingerprintOptions = {},
): Promise<DedupImagesResult> {
  const { timeoutMs = 8000, concurrency = 3 } = options;

  if (items.length === 0) return { items: [], removedCount: 0 };

  const results = new Array<ImageItem | undefined>(items.length);
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
      results[currentIndex] = item;
    }

    await runNext();
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(runNext());
  }
  await Promise.all(workers);

  const deduped = results.filter(
    (item): item is ImageItem => item !== undefined,
  );
  return { items: deduped, removedCount: items.length - deduped.length };
}

async function fetchImageFingerprint(
  url: string,
  timeoutMs: number,
): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'triplef-harness/1.0' },
    });

    if (!response.ok) return undefined;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) return undefined;

    return buildImageFingerprint(buffer, 512);
  } catch {
    return undefined;
  }
}
