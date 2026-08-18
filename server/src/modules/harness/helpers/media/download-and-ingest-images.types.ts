import type { SharpOptions } from '../../../sharp/dtos/sharp-options.dto.js';
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
  /** Pixel dimensions of the stored (original) image. */
  width?: number;
  height?: number;
  /**
   * Normalized 512 content fingerprint of the original download — the
   * identity key the shown-media registry dedupes against across turns,
   * independent of the stored original.
   */
  fingerprint: string;
  /**
   * The pproc-resized image bytes — kept only when `keepBuffers` is set, so
   * image-self-analysis tasks can feed cloud reference candidates to the
   * response model for visual verification. MinIO stores the original
   * download; these resized bytes never leave the model-input path.
   */
  buffer?: Buffer;
}

export interface DownloadAndIngestOptions {
  sessionId?: string;
  conversationId?: string;
  requestId: string;
  timeoutMs: number;
  /**
   * Resize settings for downloaded cloud images before upload, resolved
   * from the effective preprocessing (pproc) config — identical to how user
   * uploads are resized. Also the acceptance floor: a source smaller than
   * the configured dimensions would store below the display target, so it
   * is rejected instead of enlarged. No download-specific dimensions exist.
   */
  resize?: Required<SharpOptions>['resize'];
  /** Fingerprints of images that are already available (e.g. user uploads). Matching cloud images are skipped. */
  existingFingerprints?: string[];
  /** Number of images downloaded in parallel. Defaults to {@link INGEST_CONCURRENCY}. */
  concurrency?: number;
  /**
   * Keep the resized image bytes on the returned entries (reference-task
   * vision verification). Off for display-path ingestion, where the buffers
   * are only uploaded.
   */
  keepBuffers?: boolean;
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
