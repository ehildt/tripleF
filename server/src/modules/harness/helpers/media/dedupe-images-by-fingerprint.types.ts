import type { ExtractedImageItem } from './extract-media-from-tools.types.js';

export interface DedupeImagesByFingerprintOptions {
  timeoutMs?: number;
  concurrency?: number;
}

export type ImageItem = ExtractedImageItem;

/** A candidate that survived dedup, with its content fingerprint when known. */
export interface FingerprintedImageItem {
  item: ImageItem;
  fingerprint?: string;
}

export interface DedupImagesResult {
  items: FingerprintedImageItem[];
  removedCount: number;
}
