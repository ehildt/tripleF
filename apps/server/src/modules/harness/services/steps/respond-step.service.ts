import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable, Logger } from '@nestjs/common';

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
import {
  type CloudReferenceImage,
  IMAGE_TEMPLATES,
} from '../../helpers/respond/build-execution-messages.helper.js';
import { mergeLocalImagesIntoResponseData } from '../../helpers/respond/merge-local-images-into-response-data.helper.js';
import { parseResponseStats } from '../../helpers/respond/parse-response-stats.helper.js';
import { reconcileDiscardedReferences } from '../../helpers/respond/reconcile-discarded-references.helper.js';
import { recordShownMedia } from '../../helpers/respond/record-shown-media.helper.js';
import { resolveRespondStatus } from '../../helpers/respond/resolve-respond-status.helper.js';
import { ensureShopOffers } from '../../helpers/sanitize/ensure-shop-offers.helper.js';
import { enforceAvailableMediaUrls } from '../../helpers/tools/enforce-available-media-urls.helper.js';
import { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';
import { ShownMediaService } from '../shown-media.service.js';

@Injectable()
export class RespondStepService implements StepHandler {
  private readonly logger = new Logger(RespondStepService.name);

  constructor(
    private readonly respondAction: RespondActionService,
    private readonly io: SocketIOService,
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

    // Image tasks (describe/compare/ocr): the response gallery is reference
    // images only — the downloaded/ingested cloud candidates. The user's own
    // uploaded images are already rendered as message attachments and must
    // never be offered or merged into the response gallery.
    const isImageTask = IMAGE_TEMPLATES.includes(ctx.outputs.intent.template);
    const responseGalleryItems = isImageTask
      ? limitedGalleryItems.filter((item) => item.source === 'cloud')
      : limitedGalleryItems;

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'respond',
        hasNewImages: ctx.hasNewImages,
        galleryItemCount: galleryItems.length,
        localItemCount: responseGalleryItems.filter(
          (item) => item.source === 'local',
        ).length,
        cloudItemCount: responseGalleryItems.filter(
          (item) => item.source === 'cloud',
        ).length,
        imageCount: ctx.processedMeta.length,
        originalImageCount: originalMeta.length,
      },
      'preparing final response',
    );

    const { content, data, inputTokens, outputTokens } =
      await this.respondAction.execute({
        requestId: ctx.requestId,
        intent: ctx.outputs.intent,
        messages: ctx.request.messages,
        availableImages: responseGalleryItems,
        cloudReferenceImages: this.buildCloudReferenceImages(
          ctx,
          limitedGalleryItems,
        ),
        model: ctx.model,
        keepAlive: ctx.request.keep_alive,
        numCtx: ctx.request.options?.num_ctx,
        think: ctx.request.think,
        stream: ctx.stream,
        abortSignal: ctx.abortSignal,
        language: ctx.filters.language,
        onTextDelta: ctx.stream
          ? (delta) => this.emitStreamDelta(ctx, delta, responseGalleryItems)
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
      responseGalleryItems,
    );

    ctx.outputs.finalContent = content;
    ctx.outputs.finalData = mediaCheckedData;
    ctx.outputs.inputTokens = inputTokens;
    ctx.outputs.outputTokens = outputTokens;

    const shownMediaResult = await recordShownMedia(
      ctx,
      mediaCheckedData,
      responseGalleryItems,
      this.shownMedia,
    );
    if (shownMediaResult.recordedCount > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'respond',
          recordedCount: shownMediaResult.recordedCount,
        },
        'shown media recorded',
      );
    }
    if (shownMediaResult.error) {
      this.logger.warn(
        {
          requestId: ctx.requestId,
          step: 'respond',
          err: shownMediaResult.error,
        },
        'shown media recording failed',
      );
    }

    const stats = parseResponseStats(content);

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'respond',
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
      },
      'response generated',
    );
  }

  /**
   * Post-generation data guards: merge uploaded images into the gallery
   * (non-image templates only), re-inject shop offers the model dropped, and
   * blank media URLs that did not come from verified tool results.
   */
  private applyResponseDataGuards(
    ctx: HarnessContext,
    data: Record<string, unknown> | undefined,
    limitedGalleryItems: GalleryItem[],
    responseGalleryItems: GalleryItem[],
  ): Record<string, unknown> | undefined {
    const isImageTask = IMAGE_TEMPLATES.includes(
      ctx.outputs.intent?.template ?? '',
    );

    // Image tasks: the uploaded local images must never enter the response
    // gallery — they are visible as attachments and are not evidence. All
    // other templates still get their local uploads merged in.
    const mergedData = isImageTask
      ? data
      : mergeLocalImagesIntoResponseData(data, limitedGalleryItems);

    // Discard verdicts: a reference the model excluded must not also appear
    // as used media or a source — the discard wins. Image tasks additionally
    // enforce full coverage: every offered cloud candidate ends up either in
    // the gallery or in the discard aside, otherwise it silently vanishes
    // (the pool is visible in Files, so unaccounted entries break the count).
    const {
      data: dataWithDiscardVerdicts,
      removedGalleryCount,
      removedSourceCount,
      droppedDiscardCount,
      complementedCount,
    } = reconcileDiscardedReferences(
      mergedData,
      limitedGalleryItems
        .filter((item) => item.source === 'cloud')
        .map((item) => ({ imageUrl: item.imageUrl, title: item.title })),
      isImageTask,
    );
    if (
      removedGalleryCount > 0 ||
      removedSourceCount > 0 ||
      droppedDiscardCount > 0 ||
      complementedCount > 0
    ) {
      this.logger.warn(
        {
          requestId: ctx.requestId,
          step: 'respond',
          removedGalleryCount,
          removedSourceCount,
          droppedDiscardCount,
          complementedCount,
        },
        'discarded references applied',
      );
    }

    // Shop-offers guard: shopping results existed but the model dropped the
    // field — inject the extracted offers so the card never shows 0 stores.
    const withOffers = ensureShopOffers(
      dataWithDiscardVerdicts,
      ctx.outputs.intent?.template,
      extractShopOffers(ctx.outputs.toolResults),
    );
    if (withOffers !== dataWithDiscardVerdicts && withOffers) {
      this.logger.warn(
        {
          requestId: ctx.requestId,
          step: 'respond',
          offerCount: Array.isArray(withOffers.shopOffers)
            ? withOffers.shopOffers.length
            : 0,
        },
        'shop offers injected from context',
      );
    }

    // Media membership enforcement: the model may only use URLs from verified
    // tool results (or uploaded images) — everything else is blanked. For
    // image tasks the local uploads are excluded from the allow-list, so any
    // user-image URL the model copied into the gallery is stripped.
    // Merge responses are exempt: their media URLs come from the conversation
    // history, i.e. answers that already passed this same check. With no fresh
    // media tools running, the allow-list would strip the merged galleries.
    const mediaCheckedData =
      ctx.outputs.intent?.template === 'merge'
        ? withOffers
        : enforceAvailableMediaUrls(
            withOffers,
            extractImageSearchItems(ctx.outputs.toolResults),
            extractVideoSearchItems(ctx.outputs.toolResults),
            responseGalleryItems.map((item) => item.imageUrl),
          );
    if (mediaCheckedData !== withOffers) {
      this.logger.warn(
        {
          requestId: ctx.requestId,
          step: 'respond',
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
        },
        'unverified media urls blanked',
      );
    }

    return mediaCheckedData;
  }

  /**
   * The response model verifies cloud reference candidates visually on
   * image-self-analysis tasks, so the ingested bytes travel with the message
   * — aligned with their availableImages entry by storage hash. Vision-less
   * models and non-image templates get none.
   */
  private buildCloudReferenceImages(
    ctx: HarnessContext,
    galleryItems: GalleryItem[],
  ): CloudReferenceImage[] {
    if (ctx.visionExcluded) return [];
    if (!IMAGE_TEMPLATES.includes(ctx.outputs.intent?.template ?? '')) {
      return [];
    }

    const ingestedByHash = new Map(
      (ctx.outputs.ingestedForRewrite ?? []).map((img) => [img.hash, img]),
    );

    return galleryItems
      .filter((item) => item.source === 'cloud')
      .flatMap((item) => {
        const hash = item.imageUrl.split('/').pop() ?? '';
        const ingested = ingestedByHash.get(hash);
        if (!ingested?.buffer) return [];
        return [
          {
            imageUrl: item.imageUrl,
            title: item.title,
            buffer: ingested.buffer,
          },
        ];
      });
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
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'respond',
          removedCount: items.length - existing.length,
        },
        'dropped missing storage objects',
      );
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
