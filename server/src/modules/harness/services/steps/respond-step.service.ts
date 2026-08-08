import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable } from '@nestjs/common';

import { MinioService } from '../../../minio/services/minio.service.js';
import { RespondActionService } from '../../actions/respond.action.js';
import { emitToSocket } from '../../helpers/emit-to-socket.helper.js';
import {
  HARNESS_ACTIVITY_KEYS,
  resolveHarnessActivityLanguage,
} from '../../helpers/harness-activity.helper.js';
import {
  buildGalleryItems,
  type GalleryItem,
  limitLocalGalleryItems,
} from '../../helpers/media/build-gallery-items.helper.js';
import { dedupeGalleryItems } from '../../helpers/media/dedupe-gallery-items.helper.js';
import {
  extractImageSearchItems,
  extractVideoSearchItems,
} from '../../helpers/media/extract-media-from-tools.helper.js';
import { extractShopOffers } from '../../helpers/media/extract-shop-offers.helper.js';
import { filterExistingGalleryItems } from '../../helpers/media/filter-existing-gallery-items.helper.js';
import { mergeLocalImagesIntoResponseData } from '../../helpers/respond/merge-local-images-into-response-data.helper.js';
import { parseResponseStats } from '../../helpers/respond/parse-response-stats.helper.js';
import { recordShownMedia } from '../../helpers/respond/record-shown-media.helper.js';
import { resolveRespondStatus } from '../../helpers/respond/resolve-respond-status.helper.js';
import { ensureShopOffers } from '../../helpers/sanitize/ensure-shop-offers.helper.js';
import { enforceAvailableMediaUrls } from '../../helpers/tools/enforce-available-media-urls.helper.js';
import { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';
import { HarnessStepLogger } from '../harness-step-logger.service.js';
import { ShownMediaService } from '../shown-media.service.js';

@Injectable()
export class RespondStepService implements StepHandler {
  constructor(
    private readonly respondAction: RespondActionService,
    private readonly io: SocketIOService,
    private readonly stepLogger: HarnessStepLogger,
    private readonly minioService: MinioService,
    private readonly shownMedia: ShownMediaService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    if (!ctx.outputs.intent)
      throw new Error('Missing interpret output — respond cannot run');

    const status = resolveRespondStatus(ctx);
    if (status) await this.emitStatus(ctx, status);

    const originalMeta = ctx.processedMeta.filter(
      (entry) => !entry.variant || entry.variant === 'original',
    );

    const galleryItems = await this.filterToExistingStorageObjects(
      ctx,
      dedupeGalleryItems(
        buildGalleryItems(
          ctx.sessionId,
          ctx.filters.conversationId,
          originalMeta,
        ),
      ),
    );

    const limitedGalleryItems = limitLocalGalleryItems(galleryItems, 3);

    this.stepLogger.log(ctx, 'respond', 'preparing final response', {
      hasNewImages: ctx.hasNewImages,
      galleryItemCount: galleryItems.length,
      localItemCount: limitedGalleryItems.filter(
        (item) => item.source === 'local',
      ).length,
      cloudItemCount: limitedGalleryItems.filter(
        (item) => item.source === 'cloud',
      ).length,
      imageCount: ctx.processedMeta.length,
      originalImageCount: originalMeta.length,
    });

    const { content, data, inputTokens, outputTokens } =
      await this.respondAction.execute({
        requestId: ctx.requestId,
        intent: ctx.outputs.intent,
        messages: ctx.request.messages,
        availableImages: limitedGalleryItems,
        model: ctx.model,
        keepAlive: ctx.request.keep_alive,
        numCtx: ctx.request.options?.num_ctx,
        think: ctx.request.think,
        stream: ctx.stream,
        abortSignal: ctx.abortSignal,
        language: ctx.filters.language,
        onTextDelta: ctx.stream
          ? (delta) => this.emitStreamDelta(ctx, delta, limitedGalleryItems)
          : undefined,
        onReasoningDelta: ctx.stream
          ? (delta) => this.emitReasoningDelta(ctx, delta)
          : undefined,
        onJsonRetry: () =>
          void this.emitStatus(ctx, HARNESS_ACTIVITY_KEYS.refining),
      });

    const mediaCheckedData = this.applyResponseDataGuards(
      ctx,
      data,
      limitedGalleryItems,
    );

    ctx.outputs.finalContent = content;
    ctx.outputs.finalData = mediaCheckedData;
    ctx.outputs.inputTokens = inputTokens;
    ctx.outputs.outputTokens = outputTokens;

    await recordShownMedia(
      ctx,
      mediaCheckedData,
      limitedGalleryItems,
      this.shownMedia,
      this.stepLogger,
    );

    const stats = parseResponseStats(content);

    this.stepLogger.log(ctx, 'respond', 'response generated', {
      model: ctx.model,
      template: ctx.outputs.intent.template,
      inputTokens,
      outputTokens,
      length: content.length,
      contentPreview: content.slice(0, 500),
      parsedHeroImageUrl: stats.heroImageUrl,
      parsedHeroVideoUrl: stats.heroVideoUrl,
      parsedGalleryItemCount: stats.galleryItemCount,
      parsedVideoGalleryItemCount: stats.videoGalleryItemCount,
    });
  }

  /**
   * Post-generation data guards: merge uploaded images into the gallery,
   * re-inject shop offers the model dropped, and blank media URLs that did
   * not come from verified tool results.
   */
  private applyResponseDataGuards(
    ctx: HarnessContext,
    data: Record<string, unknown> | undefined,
    limitedGalleryItems: GalleryItem[],
  ): Record<string, unknown> | undefined {
    const mergedData = mergeLocalImagesIntoResponseData(
      data,
      limitedGalleryItems,
    );

    // Shop-offers guard: shopping results existed but the model dropped the
    // field — inject the extracted offers so the card never shows 0 stores.
    const withOffers = ensureShopOffers(
      mergedData,
      ctx.outputs.intent?.template,
      extractShopOffers(ctx.outputs.toolResults),
    );
    if (withOffers !== mergedData) {
      this.stepLogger.warn(
        ctx,
        'respond',
        'shop offers injected from context',
        {
          offerCount: (withOffers?.shopOffers as unknown[]).length,
        },
      );
    }

    // Media membership enforcement: the model may only use URLs from verified
    // tool results (or uploaded images) — everything else is blanked.
    const mediaCheckedData = enforceAvailableMediaUrls(
      withOffers,
      extractImageSearchItems(ctx.outputs.toolResults),
      extractVideoSearchItems(ctx.outputs.toolResults),
      limitedGalleryItems.map((item) => item.imageUrl),
    );
    if (mediaCheckedData !== withOffers) {
      this.stepLogger.warn(ctx, 'respond', 'unverified media urls blanked', {
        heroImageUrl: mediaCheckedData?.heroImageUrl === '',
        galleryItemCount: Array.isArray(mediaCheckedData?.galleryItems)
          ? mediaCheckedData.galleryItems.length
          : 0,
        heroVideoUrl: mediaCheckedData?.heroVideoUrl === '',
        videoGalleryItemCount: Array.isArray(
          mediaCheckedData?.videoGalleryItems,
        )
          ? mediaCheckedData.videoGalleryItems.length
          : 0,
      });
    }

    return mediaCheckedData;
  }

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
      this.stepLogger.log(ctx, 'respond', 'dropped missing storage objects', {
        removedCount: items.length - existing.length,
      });
    }

    return existing;
  }

  private async emitStatus(ctx: HarnessContext, key: string): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      activity: { key },
      language: resolveHarnessActivityLanguage(ctx),
      done: false,
    });
  }

  private async emitReasoningDelta(
    ctx: HarnessContext,
    reasoningDelta: string,
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      reasoningDelta,
      language: resolveHarnessActivityLanguage(ctx),
      done: false,
    });
  }

  private async emitStreamDelta(
    ctx: HarnessContext,
    delta: string,
    galleryItems: GalleryItem[],
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      delta,
      images: galleryItems,
      language: resolveHarnessActivityLanguage(ctx),
      done: false,
    });
  }
}
