import { Injectable } from '@nestjs/common';

import { MinioService } from '../../minio/services/minio.service.js';
import { downloadAndIngestImages } from '../helpers/media/download-and-ingest-images.helper.js';
import type { IngestedImage } from '../helpers/media/download-and-ingest-images.types.js';

const DEFAULT_MIN_WIDTH = 1280;
const DEFAULT_MIN_HEIGHT = 720;
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_DIMENSION = 512;

/**
 * Downloads external image URLs, validates minimum dimensions, and uploads
 * the valid ones to MinIO as cloud-sourced images for the current conversation.
 */
@Injectable()
export class CloudImageIngestionService {
  constructor(private readonly minioService: MinioService) {}

  async ingest(
    imageItems: Array<{ imageUrl: string; title?: string }>,
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    options?: {
      minWidth?: number;
      minHeight?: number;
      timeoutMs?: number;
      maxDimension?: number;
      maxBytes?: number;
      existingFingerprints?: string[];
    },
  ): Promise<IngestedImage[]> {
    if (!sessionId || !conversationId) return [];

    const buildStorageUrl = (hash: string) =>
      `/api/v1/storage/${sessionId}/${conversationId}/${hash}`;

    return downloadAndIngestImages(
      imageItems,
      (sid, cid, rid, buffers, meta) =>
        this.minioService.uploadBuffers(sid, cid, rid, buffers, meta),
      (sid, cid, hash) =>
        this.minioService.objectExists(
          sid ?? 'unknown-session',
          cid ?? 'unknown-conversation',
          hash,
        ),
      buildStorageUrl,
      {
        sessionId,
        conversationId,
        requestId,
        minWidth: options?.minWidth ?? DEFAULT_MIN_WIDTH,
        minHeight: options?.minHeight ?? DEFAULT_MIN_HEIGHT,
        timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxDimension: options?.maxDimension ?? DEFAULT_MAX_DIMENSION,
        maxBytes: options?.maxBytes,
        existingFingerprints: options?.existingFingerprints ?? [],
      },
    );
  }
}
