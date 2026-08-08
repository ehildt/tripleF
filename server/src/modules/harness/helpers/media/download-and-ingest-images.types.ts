import type { FastifyMultipartMeta } from '../../dtos/harness-job.dto.js';

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
  /** Pixel dimensions of the stored (resized) image. */
  width?: number;
  height?: number;
  /**
   * Normalized 512 content fingerprint of the original download — the
   * identity key the shown-media registry dedupes against across turns,
   * independent of the stored resize.
   */
  fingerprint: string;
}

export interface DownloadAndIngestOptions {
  sessionId?: string;
  conversationId?: string;
  requestId: string;
  minWidth: number;
  minHeight: number;
  timeoutMs: number;
  /** Maximum pixel dimension for downloaded cloud images before upload. */
  maxDimension?: number;
  /** Hard cap on the downloaded body size. */
  maxBytes?: number;
  /** Fingerprints of images that are already available (e.g. user uploads). Matching cloud images are skipped. */
  existingFingerprints?: string[];
  /** Number of images downloaded in parallel. Defaults to {@link INGEST_CONCURRENCY}. */
  concurrency?: number;
}

export type UploadFn = (
  sessionId: string | undefined,
  conversationId: string | undefined,
  requestId: string,
  buffers: Buffer[],
  meta?: FastifyMultipartMeta[],
) => Promise<string[]>;

export type ObjectExistsFn = (
  sessionId: string | undefined,
  conversationId: string | undefined,
  hash: string,
) => Promise<boolean>;

export type BuildStorageUrlFn = (hash: string) => string;
