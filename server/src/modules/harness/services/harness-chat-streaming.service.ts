import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable } from '@nestjs/common';

import { MinioService } from '../../minio/services/minio.service.js';
import {
  buildGalleryItems,
  type GalleryItem,
  limitLocalGalleryItems,
} from '../helpers/build-gallery-items.helper.js';
import { emitToSocket } from '../helpers/emit-to-socket.helper.js';
import { extractImageCountFromToolResults } from '../helpers/extract-image-count-from-tool-results.helper.js';
import { extractVideoCountFromToolResults } from '../helpers/extract-video-count-from-tool-results.helper.js';
import { filterExistingGalleryItems } from '../helpers/filter-existing-gallery-items.helper.js';

import { HarnessContext } from './harness-context.type.js';
import { HarnessStepLogger } from './harness-step-logger.service.js';

@Injectable()
export class HarnessChatStreamingService {
  constructor(
    private readonly io: SocketIOService,
    private readonly stepLogger: HarnessStepLogger,
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
      this.stepLogger.log(ctx, 'stream', 'dropped missing storage objects', {
        removedCount: items.length - existing.length,
      });
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

    const metaForStream = images.map(({ imageUrl, title, source }) => ({
      name: title,
      hash: imageUrl.split('/').pop() ?? '',
      source,
      variant: 'original' as const,
    }));
    const template = ctx.outputs.intent?.template ?? 'text';

    this.stepLogger.log(ctx, 'stream', 'result', {
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
    });

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
      images,
      toolResults: ctx.outputs.toolResults,
      availableImages: ctx.outputs.availableImages,
      availableVideos: ctx.outputs.availableVideos,
      meta: metaForStream,
      prompt: ctx.lastUserPrompt,
      promptEvalCount: ctx.outputs.inputTokens,
      evalCount: ctx.outputs.outputTokens,
      done: true,
    };

    this.stepLogger.log(ctx, 'stream', 'emitting final payload', {
      hasDoneFlag: streamPayload.done === true,
      hasPromptEvalCount: streamPayload.promptEvalCount != null,
      hasEvalCount: streamPayload.evalCount != null,
      hasData: streamPayload.data != null,
      deltaLength: streamPayload.delta?.length ?? 0,
    });

    await emitToSocket(this.io, ctx.roomId, ctx.event, streamPayload);
  }
}
