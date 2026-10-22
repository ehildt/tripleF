import { Injectable, Logger } from '@nestjs/common';
import { isImageTaskTemplate } from '@triplef/agent/schemas';
import { SocketIOService } from '@triplef/socketio';

import { MinioService } from '../../minio/services/minio.service.js';
import {
  emitHarnessEvent,
  HARNESS_EVENT_TYPES,
} from '../helpers/emit-harness-event.helper.js';
import {
  buildGalleryItems,
  type GalleryItem,
  limitLocalGalleryItems,
} from '../helpers/media/build-gallery-items.helper.js';
import { extractImageCountFromToolResults } from '../helpers/media/extract-image-count-from-tool-results.helper.js';
import { extractVideoCountFromToolResults } from '../helpers/media/extract-video-count-from-tool-results.helper.js';
import { filterExistingGalleryItems } from '../helpers/media/filter-existing-gallery-items.helper.js';

import { mapStreamMeta } from './helpers/map-stream-meta.helper.js';
import { HarnessContext } from './harness-context.type.js';

@Injectable()
export class HarnessChatStreamingService {
  private readonly logger = new Logger(HarnessChatStreamingService.name);

  constructor(
    private readonly io: SocketIOService,
    private readonly minioService: MinioService,
  ) {}

  /**
   * Gallery items point at MinIO storage objects that may have been deleted
   * since the meta was recorded. Stat each object and drop the dead ones.
   */
  private async filterToExistingStorageObjects(
    ctx: HarnessContext,
    items: GalleryItem[],
  ): Promise<GalleryItem[]> {
    const conversationId = ctx.filters.conversationId;
    if (!ctx.sessionId || !conversationId || items.length === 0) return items;

    const existing = await filterExistingGalleryItems(items, (hash) =>
      this.minioService.objectExists(ctx.sessionId!, conversationId, hash),
    );

    if (existing.length !== items.length) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'stream',
          removedCount: items.length - existing.length,
        },
        'dropped missing storage objects',
      );
    }

    return existing;
  }

  async streamResult(ctx: HarnessContext): Promise<void> {
    if (ctx.doneReason === 'clarification') {
      await emitHarnessEvent(
        this.io,
        ctx.event,
        ctx.roomId,
        ctx.requestId,
        HARNESS_EVENT_TYPES.completed,
        {
          template: 'text',
          result: ctx.outputs.intent!.clarificationQuestion,
        },
      );
      return;
    }

    if (ctx.doneReason === 'error') {
      await emitHarnessEvent(
        this.io,
        ctx.event,
        ctx.roomId,
        ctx.requestId,
        HARNESS_EVENT_TYPES.failed,
        {
          reason: ctx.error || 'An unexpected error occurred',
        },
      );
      return;
    }

    if (!ctx.outputs.finalContent) {
      const message =
        ctx.outputs.finalContent === undefined
          ? 'No response content produced'
          : 'The model returned an empty response';
      await emitHarnessEvent(
        this.io,
        ctx.event,
        ctx.roomId,
        ctx.requestId,
        HARNESS_EVENT_TYPES.failed,
        {
          reason: message,
        },
      );
      return;
    }

    const originalMeta = ctx.processedMeta.filter(
      (entry) => !entry.variant || entry.variant === 'original',
    );

    const images = limitLocalGalleryItems(
      await this.filterToExistingStorageObjects(
        ctx,
        buildGalleryItems(
          ctx.sessionId,
          ctx.filters.conversationId,
          originalMeta,
        ),
      ),
      3,
    );

    // Image tasks (describe/compare/ocr): the response gallery is reference
    // images only — the user's own uploaded images are already visible as
    // message attachments and must never reach the client gallery/lightbox.
    const template = ctx.outputs.intent?.template ?? 'text';
    const responseImages = isImageTaskTemplate(template)
      ? images.filter((item) => item.source === 'cloud')
      : images;

    const metaForStream = images.map(mapStreamMeta);

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'stream',
        sessionId: ctx.sessionId,
        hasNewImages: ctx.hasNewImages,
        template,
        imageCount: ctx.processedMeta.length,
        originalImageCount: originalMeta.length,
        galleryItemCount: images.length,
        // Curated pools (what the respond model and the client fallback
        // actually saw) — not the raw tool results, whose count would mask
        // exactly the pool shrinkage this log is meant to debug.
        availableImageCount: ctx.outputs.availableImages?.length ?? 0,
        availableVideoCount: ctx.outputs.availableVideos?.length ?? 0,
        toolResultImageCount: extractImageCountFromToolResults(
          ctx.outputs.toolResults,
        ),
        toolResultVideoCount: extractVideoCountFromToolResults(
          ctx.outputs.toolResults,
        ),
      },
      'result',
    );

    // The guarded response data (media membership enforced, shop offers
    // merged, local images injected) is authoritative for every mode —
    // stream and non-stream alike. Without it a non-streamed response
    // would reach the client as the raw, pre-guard model JSON.
    const streamPayload = {
      template,
      result: ctx.stream ? undefined : ctx.outputs.finalContent,
      data: ctx.outputs.finalData,
      images: responseImages,
      toolResults: ctx.outputs.toolResults,
      availableImages: ctx.outputs.availableImages,
      availableVideos: ctx.outputs.availableVideos,
      meta: metaForStream,
      prompt: ctx.lastUserPrompt,
      usage: {
        promptEvalCount: ctx.outputs.inputTokens,
        evalCount: ctx.outputs.outputTokens,
      },
    };

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'stream',
        hasPromptEvalCount: streamPayload.usage.promptEvalCount != null,
        hasEvalCount: streamPayload.usage.evalCount != null,
        hasData: streamPayload.data != null,
        resultLength: streamPayload.result?.length ?? 0,
      },
      'emitting final payload',
    );

    await emitHarnessEvent(
      this.io,
      ctx.event,
      ctx.roomId,
      ctx.requestId,
      HARNESS_EVENT_TYPES.completed,
      streamPayload,
    );
  }
}
