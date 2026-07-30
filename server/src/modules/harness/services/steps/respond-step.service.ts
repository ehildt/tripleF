import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Injectable } from '@nestjs/common';

import { MinioService } from '../../../minio/services/minio.service.js';
import { RespondActionService } from '../../actions/respond.action.js';
import {
  buildGalleryItems,
  type GalleryItem,
  limitLocalGalleryItems,
} from '../../helpers/build-gallery-items.helper.js';
import { dedupeGalleryItems } from '../../helpers/dedupe-gallery-items.helper.js';
import { emitToSocket } from '../../helpers/emit-to-socket.helper.js';
import { enforceAvailableMediaUrls } from '../../helpers/enforce-available-media-urls.helper.js';
import { ensureShopOffers } from '../../helpers/ensure-shop-offers.helper.js';
import {
  extractImageSearchItems,
  extractVideoSearchItems,
} from '../../helpers/extract-media-from-tools.helper.js';
import { extractShopOffers } from '../../helpers/extract-shop-offers.helper.js';
import { extractStorageHash } from '../../helpers/extract-storage-hash.helper.js';
import { filterExistingGalleryItems } from '../../helpers/filter-existing-gallery-items.helper.js';
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

    const status = this.resolveRespondStatus(ctx);
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
        onTextDelta: ctx.stream
          ? (delta) => this.emitStreamDelta(ctx, delta, limitedGalleryItems)
          : undefined,
        onReasoningDelta: ctx.stream
          ? (delta) => this.emitReasoningDelta(ctx, delta)
          : undefined,
        onJsonRetry: () =>
          void this.emitStatus(ctx, 'Refining the response format…'),
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

    await this.recordShownMedia(ctx, mediaCheckedData, limitedGalleryItems);

    const stats = this.parseResponseStats(content);

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
    const mergedData = this.mergeLocalImagesIntoResponseData(
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
   * Only announce preparation when there are images to gather — statting the
   * storage objects below is the visible work of this step. Without images
   * the step goes straight to the model, whose reasoning stream announces
   * itself ("Consolidating everything.."), so a status here would just be a redundant
   * "getting ready" beat between the previous step and the thinking.
   */
  private resolveRespondStatus(ctx: HarnessContext): string | undefined {
    if (ctx.processedMeta.length > 0) return 'Gathering the images…';
    return undefined;
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

  private mergeLocalImagesIntoResponseData(
    data: Record<string, unknown> | undefined,
    galleryItems: GalleryItem[],
  ): Record<string, unknown> | undefined {
    if (!data) return data;

    const existingHashes = new Set<string>(
      ((data.galleryItems as GalleryItem[]) ?? [])
        .filter(
          (item): item is GalleryItem => typeof item?.imageUrl === 'string',
        )
        .map((item) => extractStorageHash(item.imageUrl))
        .filter((hash): hash is string => !!hash),
    );

    const missingLocal = galleryItems
      .filter((item) => item.source === 'local')
      .filter((item) => {
        const hash = extractStorageHash(item.imageUrl);
        return hash ? !existingHashes.has(hash) : false;
      });

    const merged = [
      ...missingLocal,
      ...((data.galleryItems as GalleryItem[]) ?? []),
    ];

    // The hero renders separately — a gallery tile repeating it would show
    // the same image twice, in the grid and in the lightbox. Remaining
    // duplicates collapse by URL and content hash.
    const heroImageUrl =
      typeof data.heroImageUrl === 'string' ? data.heroImageUrl : undefined;
    const withoutHeroDuplicates = heroImageUrl
      ? merged.filter((item) => item.imageUrl !== heroImageUrl)
      : merged;

    return {
      ...data,
      galleryItems: dedupeGalleryItems(withoutHeroDuplicates),
    };
  }

  /**
   * Persist the media this response rendered so the next media-list
   * follow-up in this conversation can skip it. Recording is best-effort:
   * a failure degrades to a possible repeat, never to a failed job.
   */
  private async recordShownMedia(
    ctx: HarnessContext,
    data: Record<string, unknown> | undefined,
    galleryItems: GalleryItem[],
  ): Promise<void> {
    if (!data) return;

    const localImageUrls = new Set(
      galleryItems
        .filter((item) => item.source === 'local')
        .map((item) => item.imageUrl),
    );
    const fingerprintByStorageUrl = new Map(
      (ctx.outputs.ingestedForRewrite ?? []).map((img) => [
        img.imageUrl,
        img.fingerprint,
      ]),
    );

    try {
      const recordedCount = await this.shownMedia.recordShownMedia({
        sessionId: ctx.sessionId,
        conversationId: ctx.filters.conversationId,
        requestId: ctx.requestId,
        data,
        sources: { localImageUrls, fingerprintByStorageUrl },
      });

      if (recordedCount > 0) {
        this.stepLogger.log(ctx, 'respond', 'shown media recorded', {
          recordedCount,
        });
      }
    } catch (error) {
      this.stepLogger.warn(ctx, 'respond', 'shown media recording failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private parseResponseStats(content: string) {
    try {
      const cleaned = content
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;

      return {
        heroImageUrl:
          typeof parsed.heroImageUrl === 'string' ? parsed.heroImageUrl : null,
        heroVideoUrl:
          typeof parsed.heroVideoUrl === 'string' ? parsed.heroVideoUrl : null,
        galleryItemCount: Array.isArray(parsed.galleryItems)
          ? parsed.galleryItems.length
          : null,
        videoGalleryItemCount: Array.isArray(parsed.videoGalleryItems)
          ? parsed.videoGalleryItems.length
          : null,
      };
    } catch {
      return {
        heroImageUrl: null,
        heroVideoUrl: null,
        galleryItemCount: null,
        videoGalleryItemCount: null,
      };
    }
  }

  private async emitStatus(
    ctx: HarnessContext,
    message: string,
  ): Promise<void> {
    await emitToSocket(this.io, ctx.roomId, ctx.event, {
      requestId: ctx.requestId,
      model: ctx.model,
      template: ctx.outputs.intent?.template,
      status: message,
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
      done: false,
    });
  }
}
