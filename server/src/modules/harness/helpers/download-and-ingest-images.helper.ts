import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import type { Metadata } from 'sharp';
import sharp from 'sharp';

import {
  BROWSER_USER_AGENT,
  HARNESS_USER_AGENT,
} from '../constants/user-agents.constant.js';
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

interface DownloadAndIngestOptions {
  sessionId?: string;
  conversationId?: string;
  requestId: string;
  minWidth: number;
  minHeight: number;
  timeoutMs: number;
  /** Maximum pixel dimension for downloaded cloud images before upload. */
  maxDimension?: number;
  /** Fingerprints of images that are already available (e.g. user uploads). Matching cloud images are skipped. */
  existingFingerprints?: string[];
  /** Number of images downloaded in parallel. Defaults to {@link INGEST_CONCURRENCY}. */
  concurrency?: number;
}

const INGEST_CONCURRENCY = 3;

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
 * Fetch an image URL with the harness agent, retrying once with a browser
 * agent when a hotlink-protecting CDN answers 403.
 */
async function fetchImage(
  url: string,
  timeoutMs: number,
): Promise<Response | undefined> {
  const send = (userAgent: string) =>
    fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': userAgent },
    });

  const initial = await send(HARNESS_USER_AGENT);
  return initial.status === 403 ? send(BROWSER_USER_AGENT) : initial;
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
    const res = await fetchImage(item.imageUrl, options.timeoutMs);
    if (!res || !res.ok) return undefined;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) return undefined;

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
