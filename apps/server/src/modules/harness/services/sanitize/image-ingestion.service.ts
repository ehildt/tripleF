import { Injectable } from '@nestjs/common';

import type { IngestedImage } from '../../helpers/media/download-and-ingest-images.types.js';
import type { ExtractedImageItem } from '../../helpers/media/extract-media-from-tools.types.js';
import { buildUserFingerprints } from '../../helpers/sanitize/build-user-fingerprints.helper.js';
import { rewriteCandidatesWithIngested } from '../../helpers/sanitize/rewrite-candidates-with-ingested.helper.js';
import { CloudImageIngestionService } from '../cloud-image-ingestion.service.js';
import type { HarnessContext } from '../harness-context.type.js';

import type { SanitizeImageIngestionResult } from './image-ingestion.service.types.js';

/**
 * Image-ingestion rounds per request: each round retries only the remaining
 * shortfall, bounding hotlink-blocking retries without unbounded loops.
 */
const CLOUD_INGEST_MAX_BATCHES = 3;

/** Ingests external sanitize candidates and rewrites them to storage URLs. */
@Injectable()
export class SanitizeImageIngestionService {
  constructor(
    private readonly cloudImageIngestion: CloudImageIngestionService,
  ) {}

  /**
   * Download verified external images into storage. Only successfully
   * ingested external URLs may reach the response. Compare/describe tasks
   * also expose their ingested references as attachments; display templates
   * only rewrite URLs.
   */
  async ingestCloudImages(
    ctx: HarnessContext,
    verifiedImages: ExtractedImageItem[],
    imageTargetCount: number,
  ): Promise<SanitizeImageIngestionResult> {
    const isImageReferenceTask =
      (ctx.outputs.intent?.template === 'compare' ||
        ctx.outputs.intent?.template === 'describe') &&
      (ctx.buffers.length > 0 || ctx.processedMeta.length > 0);
    const hasExternalImages = verifiedImages.some((item) =>
      item.imageUrl.startsWith('http'),
    );

    if (!isImageReferenceTask && !hasExternalImages) {
      return {
        verifiedImages: verifiedImages.slice(0, imageTargetCount),
        ingestedImages: [],
        ingestedForRewrite: [],
      };
    }

    if (isImageReferenceTask) {
      const sliced = verifiedImages.slice(0, imageTargetCount);
      const existingFingerprints = buildUserFingerprints(ctx.processedMeta);
      // Candidate bytes stay server-side; the model uses textual evidence.
      const ingestedForRewrite = await this.ingestExternalImages(
        ctx,
        sliced,
        existingFingerprints,
        false,
      );
      const ingestedByUrl = new Map(
        ingestedForRewrite.map((image) => [image.sourceUrl, image]),
      );

      return {
        verifiedImages: rewriteCandidatesWithIngested(sliced, ingestedByUrl),
        ingestedImages: ingestedForRewrite,
        ingestedForRewrite,
      };
    }

    // Local images keep their slots. External batches continue until the
    // target is filled, candidates are exhausted, or the batch cap is hit.
    const locals = verifiedImages.filter(
      (item) => !item.imageUrl.startsWith('http'),
    );
    const externals = verifiedImages.filter((item) =>
      item.imageUrl.startsWith('http'),
    );
    const externalTarget = Math.max(imageTargetCount - locals.length, 0);

    const ingestedForRewrite: IngestedImage[] = [];
    let offset = 0;
    let batch = 0;
    while (
      ingestedForRewrite.length < externalTarget &&
      offset < externals.length &&
      batch < CLOUD_INGEST_MAX_BATCHES
    ) {
      const needed = externalTarget - ingestedForRewrite.length;
      const chunk = externals.slice(offset, offset + needed);
      const ingested = await this.ingestExternalImages(ctx, chunk, []);
      ingestedForRewrite.push(...ingested);
      offset += chunk.length;
      batch++;
    }

    const ingestedByUrl = new Map(
      ingestedForRewrite.map((image) => [image.sourceUrl, image]),
    );

    return {
      verifiedImages: rewriteCandidatesWithIngested(
        verifiedImages,
        ingestedByUrl,
      ).slice(0, imageTargetCount),
      ingestedImages: [],
      ingestedForRewrite,
    };
  }

  private async ingestExternalImages(
    ctx: HarnessContext,
    verifiedImages: ExtractedImageItem[],
    existingFingerprints: string[],
    keepBuffers = false,
  ): Promise<IngestedImage[]> {
    const externalOnly = verifiedImages.filter(
      (item) =>
        item.imageUrl.startsWith('http://') ||
        item.imageUrl.startsWith('https://'),
    );
    if (externalOnly.length === 0) return [];

    return this.cloudImageIngestion.ingest(
      externalOnly,
      ctx.sessionId,
      ctx.filters.conversationId,
      ctx.requestId,
      { existingFingerprints, keepBuffers },
    );
  }
}
