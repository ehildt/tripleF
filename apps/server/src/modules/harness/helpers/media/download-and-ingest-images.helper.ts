import { Logger } from '@nestjs/common';
import { hashPayload } from '@triplef/helpers/hash-payload';
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

const ingestDebugLogger = new Logger('DownloadAndIngestImages');

/**
 * Resize a downloaded image with the effective preprocessing (pproc) resize
 * settings — the same dimensions user uploads get (fit inside, never
 * enlarge), converted to PNG. `resize` always comes from the caller's
 * resolved config; when absent the image is only converted, not scaled.
 */
async function resizeDownloadedImage(
  buffer: Buffer,
  resize: DownloadAndIngestOptions['resize'],
): Promise<Buffer> {
  if (!resize) return sharp(buffer).png().toBuffer();

  return sharp(buffer)
    .resize({
      width: resize.maxWidth ?? undefined,
      height: resize.maxHeight ?? undefined,
      withoutEnlargement: resize.withoutEnlargement,
      fit: 'inside',
    })
    .png()
    .toBuffer();
}

/**
 * Verify a downloaded buffer satisfies the size floor: at least as large as
 * the configured pproc resize dimensions, so a stored (never enlarged)
 * image always fills the display target. An unset axis is not gated.
 */
async function meetsResizeFloor(
  buffer: Buffer,
  resize: DownloadAndIngestOptions['resize'],
): Promise<boolean> {
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) return false;
  if (resize?.maxWidth && metadata.width < resize.maxWidth) return false;
  if (resize?.maxHeight && metadata.height < resize.maxHeight) return false;
  return true;
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
    });
    if (!buffer || buffer.length === 0) return undefined;

    const fitsDisplay = await meetsResizeFloor(buffer, options.resize);
    if (!fitsDisplay) return undefined;

    // Identity key: a fixed 512 normalization collapses CDN variants of the
    // same source onto one key across turns, image hosts, and registry
    // generations. Never a stored or displayed image.
    const fingerprint = await buildImageFingerprint(buffer, 512);

    // The model's pixel attachment: resized to the effective pproc
    // dimensions. Only these bytes travel with the entry (keepBuffers) —
    // MinIO stores the ORIGINAL download, so the gallery and lightbox show
    // full resolution.
    const resizedBuffer = await resizeDownloadedImage(buffer, options.resize);

    // The stored object is the original download, hashed as-is.
    const metadata = await sharp(buffer).metadata();
    const hash = hashPayload(buffer, 'sha256');

    // Skip cloud candidates identical to the user's own uploads (same 512
    // fingerprint) — the user's image is already visible as an attachment.
    if (
      options.existingFingerprints?.length &&
      options.existingFingerprints.includes(fingerprint)
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
        [buffer],
        [
          {
            name,
            type: resolveContentType(metadata),
            hash,
            variant: 'original',
            size: buffer.length,
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
      ...(options.keepBuffers ? { buffer: resizedBuffer } : {}),
    };
  } catch (error) {
    // TEMP DEBUG: surface the real ingest failure for the current
    // investigation — remove once the drop cause is identified.
    ingestDebugLogger.error(
      `[ingest-debug] failed to ingest ${item.imageUrl}:`,
      error instanceof Error ? error.message : String(error),
    );
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
