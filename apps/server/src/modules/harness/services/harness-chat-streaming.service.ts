import { Injectable, Logger } from '@nestjs/common';
import { SocketIOService } from '@triplef/socketio';

import { MinioService } from '../../minio/services/minio.service.js';
import { emitToSocket } from '../helpers/emit-to-socket.helper.js';
import {
  buildGalleryItems,
  type GalleryItem,
  limitLocalGalleryItems,
} from '../helpers/media/build-gallery-items.helper.js';
import { extractImageCountFromToolResults } from '../helpers/media/extract-image-count-from-tool-results.helper.js';
import { extractVideoCountFromToolResults } from '../helpers/media/extract-video-count-from-tool-results.helper.js';
import { filterExistingGalleryItems } from '../helpers/media/filter-existing-gallery-items.helper.js';
import { IMAGE_TEMPLATES } from '../helpers/respond/build-execution-messages.helper.js';

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
      await emitToSocket(this.io, ctx.roomId, ctx.event, {
        requestId: ctx.requestId,
        model: ctx.model,
        template: 'text',
        delta: ctx.outputs.intent!.clarificationQuestion,
        done: true,
      });
      return;
    }

    if (ctx.doneReason === 'error') {
      await emitToSocket(this.io, ctx.roomId, ctx.event, {
        requestId: ctx.requestId,
        model: ctx.model,
        template: 'text',
        delta: ctx.error || 'An unexpected error occurred',
        error: ctx.error,
        done: true,
      });
      return;
    }

    if (!ctx.outputs.finalContent) {
      const message =
        ctx.outputs.finalContent === undefined
          ? 'No response content produced'
          : 'The model returned an empty response';
      await emitToSocket(this.io, ctx.roomId, ctx.event, {
        requestId: ctx.requestId,
        model: ctx.model,
        template: 'text',
        delta: message,
        error: message,
        done: true,
      });
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
    const responseImages = IMAGE_TEMPLATES.includes(template)
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
        availableImageCount: extractImageCountFromToolResults(
          ctx.outputs.toolResults,
        ),
        availableVideoCount: extractVideoCountFromToolResults(
          ctx.outputs.toolResults,
        ),
      },
      'result',
    );

    // The guarded response data (media membership enforced, shop offers
    // merged, local images injected) is authoritative for every mode —
    // stream and non-stream alike. Without it a non-streamed response
    // would reach the client as the raw, pre-guard model JSON via delta.
    const streamPayload = {
      requestId: ctx.requestId,
      model: ctx.model,
      template,
      delta: ctx.stream ? '' : ctx.outputs.finalContent,
      data: ctx.outputs.finalData,
      images: responseImages,
      toolResults: ctx.outputs.toolResults,
      availableImages: ctx.outputs.availableImages,
      availableVideos: ctx.outputs.availableVideos,
      meta: metaForStream,
      prompt: ctx.lastUserPrompt,
      promptEvalCount: ctx.outputs.inputTokens,
      evalCount: ctx.outputs.outputTokens,
      done: true,
    };

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'stream',
        hasDoneFlag: streamPayload.done === true,
        hasPromptEvalCount: streamPayload.promptEvalCount != null,
        hasEvalCount: streamPayload.evalCount != null,
        hasData: streamPayload.data != null,
        deltaLength: streamPayload.delta?.length ?? 0,
      },
      'emitting final payload',
    );

    await emitToSocket(this.io, ctx.roomId, ctx.event, streamPayload);
  }
}
