import type { FastifyMultipartFilter } from './harness-job.dto.types.js';

export type FastifyMultipartMeta = {
  name: string;
  type: string;
  hash: string;
  variant?: string;
  size?: number;
  source?: 'local' | 'cloud';
  /** Optional canonical 512px content fingerprint used to compare user images with downloaded cloud images. */
  fingerprint?: string;
};

export type FastifyMultipartDataWithFiltersReq = {
  buffers: Array<Buffer>;
  meta: Array<FastifyMultipartMeta>;
  filters: Partial<FastifyMultipartFilter>;
};

/** Metadata-only payload stored in BullMQ. Buffers are offloaded to MinIO. */
export type HarnessJobPayload = {
  meta: Array<FastifyMultipartMeta>;
  filters: Partial<
    FastifyMultipartFilter & { think: boolean | 'low' | 'medium' | 'high' }
  >;
};
