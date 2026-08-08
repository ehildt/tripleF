import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import type { Metadata } from 'sharp';
import sharp from 'sharp';

import { buildImageFingerprint } from './build-image-fingerprint.helper.js';
import type {
  BuildStorageUrlFn,
  DownloadAndIngestOptions,
  IngestedImage,
  ObjectExistsFn,
  UploadFn,
} from './download-and-ingest-images.types.js';
import { fetchImageBuffer } from './fetch-image-buffer.helper.js';

const INGEST_CONCURRENCY = 3;

/**
 * Resize a downloaded image down to a maximum dimension, preserving aspect ratio.
 * Images already within the limit are converted to PNG without resize.
 */
async function resizeDownloadedImage(
  buffer: Buffer,
  maxDimension: number | undefined,
): Promise<Buffer> {
  const target = maxDimension ?? 512;
  const { width, height } = await sharp(buffer).metadata();

  const shouldResize =
    (width ?? target) > target || (height ?? target) > target;
  const pipeline = shouldResize
    ? sharp(buffer).resize({
        width: target,
        height: target,
        fit: 'inside',
        withoutEnlargement: true,
      })
    : sharp(buffer);

  return pipeline.png().toBuffer();
}

/**
 * Verify a downloaded buffer satisfies the minimum dimension requirements.
 */
async function isValidImageSize(
  buffer: Buffer,
  minWidth: number,
  minHeight: number,
): Promise<boolean> {
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) return false;
  return metadata.width >= minWidth && metadata.height >= minHeight;
}

/**
 * Determine the content type for an ingested image from sharp metadata.
 */
function resolveContentType(metadata: Metadata): string {
  return metadata.format ? `image/${metadata.format}` : 'image/png';
}

/**
 * Ingest a single external image URL, reusing an existing MinIO object when the
 * resized content hash already exists.
 */
async function ingestImage(
  item: { imageUrl: string; title?: string },
  uploadFn: UploadFn,
  objectExistsFn: ObjectExistsFn,
  buildStorageUrl: BuildStorageUrlFn,
  options: DownloadAndIngestOptions,
): Promise<IngestedImage | undefined> {
  try {
    const buffer = await fetchImageBuffer(item.imageUrl, {
      timeoutMs: options.timeoutMs,
      maxBytes: options.maxBytes,
    });
    if (!buffer || buffer.length === 0) return undefined;

    const validSize = await isValidImageSize(
      buffer,
      options.minWidth,
      options.minHeight,
    );
    if (!validSize) return undefined;

    // Fingerprint the untouched download: a fixed 512 normalization makes
    // the same source content collapse onto one key across turns, image
    // hosts, and registry generations.
    const fingerprint = await buildImageFingerprint(buffer, 512);
    const resizedBuffer = await resizeDownloadedImage(
      buffer,
      options.maxDimension,
    );
    const metadata = await sharp(resizedBuffer).metadata();
    const hash = hashPayload(resizedBuffer, 'sha256');

    if (
      options.existingFingerprints?.length &&
      options.existingFingerprints.includes(hash)
    ) {
      return undefined;
    }

    const name = item.title || `cloud-${hash.slice(0, 12)}`;

    const alreadyExists = await objectExistsFn(
      options.sessionId,
      options.conversationId,
      hash,
    );

    if (!alreadyExists) {
      await uploadFn(
        options.sessionId,
        options.conversationId,
        options.requestId,
        [resizedBuffer],
        [
          {
            name,
            type: resolveContentType(metadata),
            hash,
            variant: 'original',
            size: resizedBuffer.length,
          },
        ],
      );
    }

    return {
      imageUrl: buildStorageUrl(hash),
      imageAlt: name,
      title: name,
      caption: name,
      source: 'cloud',
      hash,
      name,
      sourceUrl: item.imageUrl,
      width: metadata.width,
      height: metadata.height,
      fingerprint,
    };
  } catch {
    return undefined;
  }
}

/**
 * Download external image URLs, verify dimensions, and upload the valid ones
 * to MinIO. Returns gallery-style entries pointing at the local storage URLs.
 *
 * Skips duplicate URLs and skips re-uploading when an identical resized image
 * already exists for the session/conversation by content hash.
 */
export async function downloadAndIngestImages(
  imageItems: Array<{ imageUrl: string; title?: string }>,
  uploadFn: UploadFn,
  objectExistsFn: ObjectExistsFn,
  buildStorageUrl: BuildStorageUrlFn,
  options: DownloadAndIngestOptions,
): Promise<IngestedImage[]> {
  const uniqueItems: Array<{ imageUrl: string; title?: string }> = [];
  const seenUrls = new Set<string>();
  for (const item of imageItems) {
    if (seenUrls.has(item.imageUrl)) continue;
    seenUrls.add(item.imageUrl);
    uniqueItems.push(item);
  }

  // Bounded worker pool — downloads and uploads for distinct URLs run in
  // parallel while result order and hash deduping stay deterministic.
  const settled: Array<IngestedImage | undefined> = new Array(
    uniqueItems.length,
  );
  let cursor = 0;
  const runNext = async (): Promise<void> => {
    const index = cursor++;
    if (index >= uniqueItems.length) return;

    settled[index] = await ingestImage(
      uniqueItems[index],
      uploadFn,
      objectExistsFn,
      buildStorageUrl,
      options,
    );
    await runNext();
  };

  const workerCount = Math.min(
    options.concurrency ?? INGEST_CONCURRENCY,
    uniqueItems.length,
  );
  await Promise.all(Array.from({ length: workerCount }, () => runNext()));

  const results: IngestedImage[] = [];
  const seenHashes = new Set<string>();
  for (const ingested of settled) {
    if (!ingested || seenHashes.has(ingested.hash)) continue;
    seenHashes.add(ingested.hash);
    results.push(ingested);
  }

  return results;
}
