import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import { Injectable } from '@nestjs/common';

import { MinioService } from '../../minio/services/minio.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { downloadAndIngestImages } from '../helpers/media/download-and-ingest-images.helper.js';
import type { IngestedImage } from '../helpers/media/download-and-ingest-images.types.js';

/**
 * Download budget for one cloud image. An ops-level sys var, not a SysCtl
 * config knob: tuning it belongs to the deployment, not the UI session.
 */
const IMAGE_DOWNLOAD_TIMEOUT_MS = getNumberEnv(
  process.env.HARNESS_IMAGE_DOWNLOAD_TIMEOUT_MS,
  8000,
) as number;

/**
 * Downloads external image URLs and uploads the valid ones to MinIO as
 * cloud-sourced images for the current conversation.
 *
 * Resize and the source-acceptance floor both come from the effective
 * preprocessing (pproc) config — live SysCtl settings over env defaults,
 * resolved per call — so stored cloud images match whatever resolution the
 * admin configured for uploads, and a source smaller than that target is
 * rejected instead of stored visibly small.
 */
@Injectable()
export class CloudImageIngestionService {
  constructor(
    private readonly minioService: MinioService,
    private readonly sharpService: SharpService,
  ) {}

  async ingest(
    imageItems: Array<{ imageUrl: string; title?: string }>,
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    options?: {
      existingFingerprints?: string[];
      keepBuffers?: boolean;
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
        timeoutMs: IMAGE_DOWNLOAD_TIMEOUT_MS,
        // Resolved per ingest call: live SysCtl changes apply to the very
        // next download, mirroring the upload path's resize exactly.
        resize: this.sharpService.effectiveResize(),
        existingFingerprints: options?.existingFingerprints ?? [],
        keepBuffers: options?.keepBuffers,
      },
    );
  }
}
