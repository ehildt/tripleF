import { Injectable, Logger } from '@nestjs/common';
import { isImageTaskTemplate } from '@triplef/agent/schemas';
import type { ToolResult } from '@triplef/ai-sdk';

import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { dedupeImagesByFingerprint } from '../helpers/media/dedupe-images-by-fingerprint.helper.js';
import type { FingerprintedImageItem } from '../helpers/media/dedupe-images-by-fingerprint.types.js';
import type { IngestedImage } from '../helpers/media/download-and-ingest-images.types.js';
import {
  extractImageSearchItems,
  extractVideoSearchItems,
} from '../helpers/media/extract-media-from-tools.helper.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../helpers/media/extract-media-from-tools.types.js';
import { isShownImage } from '../helpers/media/is-shown-image.helper.js';
import { isShownVideo } from '../helpers/media/is-shown-video.helper.js';
import { buildIngestedByUrlMap } from '../helpers/sanitize/build-ingested-by-url-map.helper.js';
import { buildUserFingerprints } from '../helpers/sanitize/build-user-fingerprints.helper.js';
import { collectExternalImageSearchUrls } from '../helpers/sanitize/collect-external-image-search-urls.helper.js';
import { collectHistoryImageUrls } from '../helpers/sanitize/collect-history-image-urls.helper.js';
import { collectHistoryVideoUrls } from '../helpers/sanitize/collect-history-video-urls.helper.js';
import {
  collectImageUrls,
  type ImageUrlEntry,
} from '../helpers/sanitize/collect-image-urls.helper.js';
import { collectPageUrls } from '../helpers/sanitize/collect-page-urls.helper.js';
import { collectVideoThumbnailUrls } from '../helpers/sanitize/collect-video-thumbnail-urls.helper.js';
import { filterVerifiedMedia } from '../helpers/sanitize/filter-verified-media.helper.js';
import { mapSanitizedToolResult } from '../helpers/sanitize/map-sanitized-tool-result.helper.js';
import { mapSanitizedToolResultWithBrokenUrls } from '../helpers/sanitize/map-sanitized-tool-result-with-broken-urls.helper.js';
import { rewriteCandidatesWithIngested } from '../helpers/sanitize/rewrite-candidates-with-ingested.helper.js';
import { sanitizeToolResultsWithIngestedUrls } from '../helpers/sanitize/sanitize-tool-result.helper.js';
import { videoUrlKeys } from '../helpers/url-trust/video-url-keys.helper.js';

import { CloudImageIngestionService } from './cloud-image-ingestion.service.js';
import type { HarnessContext } from './harness-context.type.js';
import {
  CLOUD_INGEST_MAX_BATCHES,
  DEFAULT_MEDIA_TARGET_COUNT,
} from './media-sanitization.constant.js';
import type { MediaSanitizationResult } from './media-sanitization.service.types.js';
import { MediaUrlValidatorService } from './media-url-validator.service.js';
import { ShownMediaService } from './shown-media.service.js';
import type { ShownMediaKeys } from './shown-media.service.types.js';

/** Result of bounded cloud-image ingestion and candidate rewriting. */
interface CloudImageIngestionResult {
  /** Verified candidates after local-storage rewriting and target slicing. */
  verifiedImages: ExtractedImageItem[];
  /** Images exposed as attachments for image-reference tasks. */
  ingestedImages: IngestedImage[];
  /** Every successfully ingested image used for source URL rewriting. */
  ingestedForRewrite: IngestedImage[];
}

/** Validates, deduplicates, filters, and ingests media before message assembly. */
@Injectable()
export class MediaSanitizationService {
  private readonly logger = new Logger(MediaSanitizationService.name);

  constructor(
    private readonly mediaUrlValidator: MediaUrlValidatorService,
    private readonly cloudImageIngestion: CloudImageIngestionService,
    private readonly providerOverrides: ProviderOverridesService,
    private readonly shownMedia: ShownMediaService,
    private readonly sharpService: SharpService,
  ) {}

  /** Sanitize tool results and prepare trustworthy, model-visible media candidates. */
  async sanitize(
    ctx: HarnessContext,
    toolResults: ToolResult[],
  ): Promise<MediaSanitizationResult> {
    const trustedToolResults = toolResults.map(mapSanitizedToolResult);

    // Probe every citation and media URL so dead media and citations cannot
    // leak into the response, including thumbnails embedded in web results.
    const allImageUrls = collectImageUrls(trustedToolResults);
    const videoThumbnailUrls = collectVideoThumbnailUrls(trustedToolResults);
    const pageUrls = collectPageUrls(trustedToolResults);
    const [brokenImageUrls, brokenThumbnailUrls, brokenPageUrls] =
      await Promise.all([
        this.findBrokenImageUrls(ctx, allImageUrls),
        this.findBrokenThumbnailUrls(ctx, videoThumbnailUrls),
        this.findBrokenPageUrls(ctx, pageUrls),
      ]);
    const brokenMediaUrls = new Set([
      ...brokenImageUrls,
      ...brokenThumbnailUrls,
    ]);
    const sanitizedToolResults = trustedToolResults.map((toolResult) =>
      mapSanitizedToolResultWithBrokenUrls(
        toolResult,
        brokenMediaUrls,
        brokenPageUrls,
      ),
    );

    const rawImageItems = extractImageSearchItems(sanitizedToolResults);
    const rawVideoItems = extractVideoSearchItems(sanitizedToolResults);
    let { images: verifiedImages, videos: verifiedVideos } =
      await filterVerifiedMedia(
        this.mediaUrlValidator,
        rawImageItems,
        rawVideoItems,
        this.sharpService.effectiveResize(),
      );

    const { items: dedupedImages, removedCount: removedDuplicateImages } =
      await dedupeImagesByFingerprint(verifiedImages);
    if (removedDuplicateImages > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          removedDuplicateImages,
          remainingImages: dedupedImages.length,
        },
        'deduplicated images by content hash',
      );
    }

    // Media-list follow-ups suppress repeats through the shown-media
    // registry and legacy history markers; recaps and reports may reuse media.
    const template = ctx.outputs.intent?.template;
    const shownKeys = await this.lookupShownKeys(ctx, template);
    verifiedImages = this.filterShownImageCandidates(
      ctx,
      template,
      shownKeys,
      dedupedImages,
    );
    verifiedVideos = this.filterShownVideoCandidates(
      ctx,
      template,
      shownKeys,
      verifiedVideos,
    );

    const explicitImageCount = ctx.outputs.intent?.imageCount ?? 0;
    const isImageTemplate = isImageTaskTemplate(template ?? '');
    const imageTargetCount =
      explicitImageCount > 0
        ? explicitImageCount
        : isImageTemplate
          ? this.providerOverrides.getConfig().sources.imageTaskReferenceCount
          : DEFAULT_MEDIA_TARGET_COUNT;
    const explicitVideoCount = ctx.outputs.intent?.videoCount ?? 0;
    const videoTargetCount =
      explicitVideoCount > 0 ? explicitVideoCount : DEFAULT_MEDIA_TARGET_COUNT;
    verifiedVideos = verifiedVideos.slice(0, videoTargetCount);

    // Only successfully downloaded and stored external images reach the
    // response. Retry bounded batches until the target is filled or exhausted.
    const ingestion = await this.ingestCloudImages(
      ctx,
      verifiedImages,
      imageTargetCount,
    );
    verifiedImages = this.filterShownIngestedImages(
      ctx,
      template,
      shownKeys,
      ingestion,
      ingestion.verifiedImages,
    );

    const droppedImageUrls = collectExternalImageSearchUrls(
      sanitizedToolResults,
      ingestion.ingestedForRewrite.map((image) => image.sourceUrl),
    );
    if (droppedImageUrls.size > 0) {
      this.logger.warn(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          droppedCount: droppedImageUrls.size,
          sampledUrls: Array.from(droppedImageUrls).slice(0, 5),
        },
        'dropped un-ingestable external images',
      );
    }

    const finalToolResults =
      ingestion.ingestedForRewrite.length > 0 || droppedImageUrls.size > 0
        ? sanitizeToolResultsWithIngestedUrls(
            sanitizedToolResults,
            buildIngestedByUrlMap(ingestion.ingestedForRewrite),
            new Set([...brokenMediaUrls, ...droppedImageUrls]),
            brokenPageUrls,
          )
        : sanitizedToolResults;

    return {
      toolResults: finalToolResults,
      images: verifiedImages,
      videos: verifiedVideos,
      ingestedImages: ingestion.ingestedImages,
      ingestedForRewrite: ingestion.ingestedForRewrite,
      brokenMediaUrls,
      brokenPageUrls,
    };
  }

  /** Load shown-media keys once for media-list follow-ups only. */
  private async lookupShownKeys(
    ctx: HarnessContext,
    template: string | undefined,
  ): Promise<ShownMediaKeys | undefined> {
    if (template !== 'imagelist' && template !== 'videolist') {
      return undefined;
    }
    return this.shownMedia.lookupKeys(
      ctx.sessionId,
      ctx.filters.conversationId,
    );
  }

  /** Drop previously shown image fingerprints before downloading candidates. */
  private filterShownImageCandidates(
    ctx: HarnessContext,
    template: string | undefined,
    shownKeys: ShownMediaKeys | undefined,
    dedupedImages: FingerprintedImageItem[],
  ): ExtractedImageItem[] {
    const fresh =
      template === 'imagelist' && shownKeys
        ? dedupedImages.filter(
            ({ fingerprint }) => !isShownImage(shownKeys, { fingerprint }),
          )
        : dedupedImages;

    const removedCount = dedupedImages.length - fresh.length;
    if (removedCount > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          removedCount,
          remainingCount: fresh.length,
        },
        'skipped previously shown images',
      );
    }

    return fresh.map(({ item }) => item);
  }

  /** Drop previously shown videos using registry and legacy history keys. */
  private filterShownVideoCandidates(
    ctx: HarnessContext,
    template: string | undefined,
    shownKeys: ShownMediaKeys | undefined,
    videos: ExtractedVideoItem[],
  ): ExtractedVideoItem[] {
    if (template !== 'videolist') return videos;

    const historyVideoUrls = collectHistoryVideoUrls(ctx.request.messages);
    if (historyVideoUrls.size === 0 && !shownKeys) return videos;

    const fresh = videos.filter((video) => {
      if (
        videoUrlKeys(video.videoUrl).some((key) => historyVideoUrls.has(key))
      ) {
        return false;
      }
      return !shownKeys || !isShownVideo(shownKeys, video.videoUrl);
    });

    const removedCount = videos.length - fresh.length;
    if (removedCount > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          removedCount,
          remainingCount: fresh.length,
        },
        'skipped previously shown videos',
      );
    }

    return fresh;
  }

  /** Drop post-ingestion repeats and remove them from the URL rewrite set. */
  private filterShownIngestedImages(
    ctx: HarnessContext,
    template: string | undefined,
    shownKeys: ShownMediaKeys | undefined,
    ingestion: CloudImageIngestionResult,
    verifiedImages: ExtractedImageItem[],
  ): ExtractedImageItem[] {
    if (template !== 'imagelist' || ingestion.ingestedForRewrite.length === 0) {
      return verifiedImages;
    }

    const legacyImageUrls = collectHistoryImageUrls(ctx.request.messages);
    if (!shownKeys && legacyImageUrls.size === 0) return verifiedImages;

    const droppedFinalUrls = new Set<string>();
    const freshForRewrite = ingestion.ingestedForRewrite.filter((entry) => {
      const shown =
        (shownKeys !== undefined &&
          isShownImage(shownKeys, {
            fingerprint: entry.fingerprint,
            storageUrl: entry.imageUrl,
          })) ||
        legacyImageUrls.has(entry.imageUrl);
      if (shown) droppedFinalUrls.add(entry.imageUrl);
      return !shown;
    });

    if (droppedFinalUrls.size === 0) return verifiedImages;

    ingestion.ingestedForRewrite = freshForRewrite;
    const fresh = verifiedImages.filter(
      (item) => !droppedFinalUrls.has(item.imageUrl),
    );

    const removedCount = verifiedImages.length - fresh.length;
    if (removedCount > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          removedCount,
          remainingCount: fresh.length,
        },
        'skipped previously shown images',
      );
    }

    return fresh;
  }

  /** Find broken or undersized images, honoring trusted dimension-check bypasses. */
  private async findBrokenImageUrls(
    ctx: HarnessContext,
    entries: ImageUrlEntry[],
  ): Promise<Set<string>> {
    if (entries.length === 0) return new Set();

    const strictUrls = entries
      .filter((entry) => !entry.skipDimensionCheck)
      .map((entry) => entry.url);
    const dimensionCheckSkippedUrls = entries
      .filter((entry) => entry.skipDimensionCheck)
      .map((entry) => entry.url);
    const resizeFloor = this.sharpService.effectiveResize();

    const [strictResults, dimensionCheckSkippedResults] = await Promise.all([
      strictUrls.length > 0
        ? this.mediaUrlValidator.validateUrls(strictUrls, {
            enabled: true,
            timeoutMs: 5000,
            maxRedirects: 3,
            concurrency: 5,
            checkImageDimensions: true,
            minWidth: resizeFloor.maxWidth,
            minHeight: resizeFloor.maxHeight ?? undefined,
            maxProbeBytes: 256 * 1024,
          })
        : Promise.resolve([]),
      dimensionCheckSkippedUrls.length > 0
        ? this.mediaUrlValidator.validateUrls(dimensionCheckSkippedUrls, {
            enabled: true,
            timeoutMs: 5000,
            maxRedirects: 3,
            concurrency: 5,
            checkImageDimensions: false,
          })
        : Promise.resolve([]),
    ]);

    const broken = [
      ...strictResults.filter((result) => result.kind !== 'image'),
      ...dimensionCheckSkippedResults.filter(
        (result) => result.kind !== 'image',
      ),
    ].map((result) => result.url);

    if (broken.length > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          brokenCount: broken.length,
          sampledUrls: broken.slice(0, 5),
        },
        'removed broken or undersized image urls',
      );
    }

    return new Set(broken);
  }

  /** Find thumbnails that do not serve a reachable image; dimensions are irrelevant. */
  private async findBrokenThumbnailUrls(
    ctx: HarnessContext,
    urls: string[],
  ): Promise<Set<string>> {
    if (urls.length === 0) return new Set();

    const results = await this.mediaUrlValidator.validateUrls(urls, {
      enabled: true,
      timeoutMs: 3000,
      maxRedirects: 3,
      concurrency: 5,
    });
    const broken = results
      .filter((result) => result.kind !== 'image')
      .map((result) => result.url);

    if (broken.length > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          brokenCount: broken.length,
          sampledUrls: broken.slice(0, 5),
        },
        'removed broken video thumbnails',
      );
    }

    return new Set(broken);
  }

  /** Drop article URLs only on definitive dead responses; blocked probes remain valid. */
  private async findBrokenPageUrls(
    ctx: HarnessContext,
    urls: string[],
  ): Promise<Set<string>> {
    if (urls.length === 0) return new Set();

    const results = await this.mediaUrlValidator.validateUrls(urls, {
      enabled: true,
      timeoutMs: 3000,
      maxRedirects: 3,
      concurrency: 5,
    });
    const broken = results
      .filter((result) => result.kind === 'broken')
      .map((result) => result.url);

    if (broken.length > 0) {
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          brokenCount: broken.length,
          sampledUrls: broken.slice(0, 5),
        },
        'removed dead article page urls',
      );
    }

    return new Set(broken);
  }

  /** Ingest external images into object storage and rewrite candidates to local URLs. */
  private async ingestCloudImages(
    ctx: HarnessContext,
    verifiedImages: ExtractedImageItem[],
    imageTargetCount: number,
  ): Promise<CloudImageIngestionResult> {
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
      // Reference bytes remain server-side Files-panel attachments; the
      // response model selects candidates using their textual evidence.
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

    // Local images retain their slots. External images are ingested in
    // bounded shortfall-sized batches so failed hosts do not shrink galleries.
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
      batch += 1;
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

  /** Filter external candidates and delegate their download/storage to the ingestion lane. */
  private async ingestExternalImages(
    ctx: HarnessContext,
    verifiedImages: ExtractedImageItem[],
    existingFingerprints: string[],
    keepBuffers: boolean = false,
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
