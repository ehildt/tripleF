import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import type { Metadata } from 'sharp';
import sharp from 'sharp';

import type { FastifyMultipartMeta } from '../dtos/harness-job.dto.js';

export interface IngestedImage {
  imageUrl: string;
  imageAlt: string;
  title: string;
  caption: string;
  source: 'cloud';
  hash: string;
  name: string;
  /** Original external URL this image was downloaded from. */
  sourceUrl: string;
}

export interface DownloadAndIngestOptions {
  sessionId?: string;
  conversationId?: string;
  requestId: string;
  minWidth: number;
  minHeight: number;
  timeoutMs: number;
  maxBytes: number;
  /** Maximum pixel dimension for downloaded cloud images before upload. */
  maxDimension?: number;
  /** Fingerprints of images that are already available (e.g. user uploads). Matching cloud images are skipped. */
  existingFingerprints?: string[];
}

type UploadFn = (
  sessionId: string | undefined,
  conversationId: string | undefined,
  requestId: string,
  buffers: Buffer[],
  meta?: FastifyMultipartMeta[],
) => Promise<string[]>;

type ObjectExistsFn = (
  sessionId: string | undefined,
  conversationId: string | undefined,
  hash: string,
) => Promise<boolean>;

type BuildStorageUrlFn = (hash: string) => string;

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
 * Determine the content type for an ingested image from sharp metadata or the
 * HTTP response headers.
 */
function resolveContentType(metadata: Metadata, res: Response): string {
  return (
    (metadata.format ? `image/${metadata.format}` : undefined) ??
    res.headers.get('content-type')?.split(';')[0] ??
    'image/png'
  );
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
    const res = await fetch(item.imageUrl, {
      signal: AbortSignal.timeout(options.timeoutMs),
      headers: { 'User-Agent': 'ckir-harness/1.0' },
    });
    if (!res.ok) return undefined;

    const contentLength = Number(res.headers.get('content-length') ?? '0');
    if (contentLength > options.maxBytes) return undefined;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0 || buffer.length > options.maxBytes)
      return undefined;

    const validSize = await isValidImageSize(
      buffer,
      options.minWidth,
      options.minHeight,
    );
    if (!validSize) return undefined;

    const resizedBuffer = await resizeDownloadedImage(
      buffer,
      options.maxDimension,
    );
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
      const metadata = await sharp(resizedBuffer).metadata();
      await uploadFn(
        options.sessionId,
        options.conversationId,
        options.requestId,
        [resizedBuffer],
        [
          {
            name,
            type: resolveContentType(metadata, res),
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
  const results: IngestedImage[] = [];
  const seenUrls = new Set<string>();
  const seenHashes = new Set<string>();

  for (const item of imageItems) {
    if (seenUrls.has(item.imageUrl)) continue;
    seenUrls.add(item.imageUrl);

    const ingested = await ingestImage(
      item,
      uploadFn,
      objectExistsFn,
      buildStorageUrl,
      options,
    );

    if (ingested && !seenHashes.has(ingested.hash)) {
      seenHashes.add(ingested.hash);
      results.push(ingested);
    }
  }

  return results;
}
