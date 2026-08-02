import { Injectable } from '@nestjs/common';

import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { applySourcePolicy } from '../helpers/apply-source-policy.helper.js';
import { buildFinalMessagesForSanitize } from '../helpers/build-final-messages.helper.js';
import { collectHistoryImageUrls } from '../helpers/collect-history-image-urls.helper.js';
import { collectHistoryVideoUrls } from '../helpers/collect-history-video-urls.helper.js';
import {
  dedupeImagesByFingerprint,
  type FingerprintedImageItem,
} from '../helpers/dedupe-images-by-fingerprint.helper.js';
import type { IngestedImage } from '../helpers/download-and-ingest-images.helper.js';
import {
  extractArticles,
  extractReferences,
} from '../helpers/extract-articles-from-tools.helper.js';
import {
  type ExtractedImageItem,
  type ExtractedVideoItem,
  extractImageSearchItems,
  extractVideoSearchItems,
} from '../helpers/extract-media-from-tools.helper.js';
import { extractPlaces } from '../helpers/extract-places.helper.js';
import { extractReviews } from '../helpers/extract-reviews.helper.js';
import { extractShopOffers } from '../helpers/extract-shop-offers.helper.js';
import { partitionByLanguage } from '../helpers/partition-by-language.helper.js';
import { sanitizeToolResult } from '../helpers/sanitize-tool-result.helper.js';
import { sanitizeToolResultsWithIngestedUrls } from '../helpers/sanitize-tool-result.helper.js';
import { tagLanguage } from '../helpers/tag-language.helper.js';
import { videoUrlKeys } from '../helpers/video-url-keys.helper.js';
import { CloudImageIngestionService } from '../services/cloud-image-ingestion.service.js';
import type { HarnessContext } from '../services/harness-context.type.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';
import { MediaUrlValidatorService } from '../services/media-url-validator.service.js';
import {
  isShownImage,
  isShownVideo,
  type ShownMediaKeys,
  ShownMediaService,
} from '../services/shown-media.service.js';

export type SanitizeResult = {
  toolResults: Array<{ toolName: string; result: unknown }>;
  messages: InputMessage[];
  availableImageCount: number;
  availableVideoCount: number;
  ingestedImages?: IngestedImage[];
  /** All cloud images ingested for URL rewriting — respond maps their
   *  fingerprints when recording shown media. */
  ingestedForRewrite?: IngestedImage[];
};

/**
 * Cloud reference images for vision tasks (compare/describe) are fed to the
 * response model — a small edge keeps them cheap. Cloud images rendered in
 * user-facing galleries and heroes keep display resolution (the imagelist
 * grid, lightbox, and article hero would otherwise show a 512px file).
 */
const CLOUD_REFERENCE_MAX_DIMENSION = 512;
const CLOUD_DISPLAY_MAX_DIMENSION = 1600;
/**
 * Image-ingestion rounds per request: round N only retries for the images
 * still missing below the target, so 3 rounds cover heavy hotlink-blocking
 * without unbounded download loops.
 */
const CLOUD_INGEST_MAX_BATCHES = 3;
/** International pools cap: the aside must never crowd out primary context. */
const INTERNATIONAL_ARTICLE_LIMIT = 6;
const INTERNATIONAL_VIDEO_LIMIT = 3;

@Injectable()
export class SanitizeActionService {
  constructor(
    private readonly mediaUrlValidator: MediaUrlValidatorService,
    private readonly cloudImageIngestion: CloudImageIngestionService,
    private readonly stepLogger: HarnessStepLogger,
    private readonly providerOverrides: ProviderOverridesService,
    private readonly shownMedia: ShownMediaService,
  ) {}

  async execute(
    ctx: HarnessContext,
    toolResults: Array<{ toolName: string; result: unknown }>,
    buffers: Buffer[],
  ): Promise<SanitizeResult> {
    // 1. Trust-based sanitize (drop untrusted hosts, keep only embeddable videos).
    const trustSanitized = this.sanitizeToolResults(toolResults);

    // 2. Collect every URL that appears anywhere in the tool results and ping
    //    each one. This covers ImageSearch URLs, article thumbnails embedded in
    //    webSearch/newsSearch results, video thumbnails, and the article/page
    //    URLs themselves, so broken media and dead citations cannot leak into
    //    the response.
    const allImageUrls = this.collectImageUrls(trustSanitized);
    const videoThumbnailUrls = this.collectVideoThumbnailUrls(trustSanitized);
    const pageUrls = this.collectPageUrls(trustSanitized);

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
    const sanitizedToolResults = this.sanitizeToolResultsWithBrokenUrls(
      trustSanitized,
      brokenMediaUrls,
      brokenPageUrls,
    );

    // 3. Extract image/video candidates and verify them against live endpoints.
    const rawImageItems = extractImageSearchItems(sanitizedToolResults);
    const rawVideoItems = extractVideoSearchItems(sanitizedToolResults);
    let { images: verifiedImages, videos: verifiedVideos } =
      await this.filterVerifiedMedia(rawImageItems, rawVideoItems);

    // 3b. Deduplicate verified images by content fingerprint.
    const { items: dedupedImages, removedCount: removedDuplicateImages } =
      await dedupeImagesByFingerprint(verifiedImages);

    if (removedDuplicateImages > 0) {
      this.stepLogger.log(
        ctx,
        'sanitize',
        'deduplicated images by content hash',
        {
          removedDuplicateImages,
          remainingImages: dedupedImages.length,
        },
      );
    }

    // Media-list follow-ups must never repeat media the user already saw:
    // the persisted shown-media registry covers every template that ever
    // rendered media; history-text markers cover pre-registry conversations.
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

    // 4. Respect explicit counts from intent (default to 6 each).
    const imageTargetCount =
      (ctx.outputs.intent?.imageCount ?? 0) > 0
        ? ctx.outputs.intent!.imageCount
        : 6;
    const videoTargetCount =
      (ctx.outputs.intent?.videoCount ?? 0) > 0
        ? ctx.outputs.intent!.videoCount
        : 6;
    verifiedVideos = verifiedVideos.slice(0, videoTargetCount);

    // 5. Ingest external images into MinIO. Bot-protected CDNs answer our
    //    link probes yet block real clients (UA/Referer/TLS checks), and a
    //    download can fail regardless — so only images we could fetch and
    //    store locally may reach the response: external URLs that were not
    //    ingested are dropped and blanked out of the tool results. Instead
    //    of truncating to the target first (every ingest failure would then
    //    shrink the gallery), ingest until `imageTargetCount` images made
    //    it into storage, drawing on the full verified candidate pool.
    const ingestion = await this.ingestCloudImages(
      ctx,
      verifiedImages,
      imageTargetCount,
    );
    verifiedImages = ingestion.verifiedImages;
    verifiedImages = this.filterShownIngestedImages(
      ctx,
      template,
      shownKeys,
      ingestion,
      verifiedImages,
    );

    const droppedImageUrls = this.collectExternalImageSearchUrls(
      sanitizedToolResults,
      ingestion.ingestedForRewrite,
    );
    if (droppedImageUrls.size > 0) {
      this.stepLogger.warn(
        ctx,
        'sanitize',
        'dropped un-ingestable external images',
        {
          droppedCount: droppedImageUrls.size,
          sampledUrls: Array.from(droppedImageUrls).slice(0, 5),
        },
      );
    }

    // 5b. Rewrite ingested image URLs inside tool results to local storage
    //     URLs and blank the dropped ones as if they were broken media.
    const finalToolResults =
      ingestion.ingestedForRewrite.length > 0 || droppedImageUrls.size > 0
        ? sanitizeToolResultsWithIngestedUrls(
            sanitizedToolResults,
            this.buildIngestedByUrlMap(ingestion.ingestedForRewrite),
            new Set([...brokenMediaUrls, ...droppedImageUrls]),
            brokenPageUrls,
          )
        : sanitizedToolResults;

    // 6. Build the final message payload with tool context for the response model.
    // Dynamic source policy (SysCtl): preferred domains rank first, blocked
    // domains are dropped entirely — before the response model ever sees them.
    const sources = this.providerOverrides.getConfig().sources;
    const articles = applySourcePolicy(
      extractArticles(finalToolResults),
      sources,
    );
    const references = applySourcePolicy(
      extractReferences(finalToolResults) as Array<Record<string, unknown>>,
      sources,
    );
    verifiedImages = applySourcePolicy(verifiedImages, sources);
    verifiedVideos = applySourcePolicy(verifiedVideos, sources);
    const shopOffers = extractShopOffers(finalToolResults);
    const reviews = extractReviews(finalToolResults);
    const places = extractPlaces(finalToolResults);

    this.stepLogger.log(ctx, 'sanitize', 'shop data extracted', {
      shopOfferCount: shopOffers.length,
      reviewCount: reviews.length,
      placeCount: places.length,
    });

    // 7. Language partition: reliably detected foreign-language articles and
    //    videos leave the primary pools for the international aside. Nothing
    //    is dropped — undetermined items stay in the primary pools.
    const userLang = ctx.outputs.intent?.language;
    await Promise.all([
      tagLanguage(articles, (a) => `${a.title ?? ''} ${a.snippet ?? ''}`),
      tagLanguage(
        verifiedVideos,
        (v) => `${v.title ?? ''} ${v.description ?? ''}`,
      ),
    ]);
    const articlePool = partitionByLanguage(articles, userLang);
    const videoPool = partitionByLanguage(verifiedVideos, userLang);
    const mainArticles = articlePool.main;
    verifiedVideos = videoPool.main;
    const internationalArticles = articlePool.international.slice(
      0,
      INTERNATIONAL_ARTICLE_LIMIT,
    );
    const internationalVideos = videoPool.international.slice(
      0,
      INTERNATIONAL_VIDEO_LIMIT,
    );

    if (internationalArticles.length || internationalVideos.length) {
      this.stepLogger.log(ctx, 'sanitize', 'language partition applied', {
        userLang,
        internationalArticleCount: internationalArticles.length,
        internationalVideoCount: internationalVideos.length,
      });
    }

    const messages = this.scrubBrokenUrlsFromMessages(
      buildFinalMessagesForSanitize(
        ctx,
        buffers,
        finalToolResults,
        verifiedImages,
        verifiedVideos,
        mainArticles,
        references,
        shopOffers,
        reviews,
        places,
        internationalArticles,
        internationalVideos,
      ),
      new Set([...brokenMediaUrls, ...brokenPageUrls]),
    );

    return {
      toolResults: finalToolResults,
      messages,
      availableImageCount: verifiedImages.length,
      availableVideoCount: verifiedVideos.length,
      ingestedImages: ingestion.ingestedImages,
      ingestedForRewrite: ingestion.ingestedForRewrite,
    };
  }

  /**
   * Look the shown-media registry up once per request — but only for
   * media-list follow-ups, where repeats are pure duplication. Recaps and
   * reports may legitimately reuse earlier media.
   */
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

  /**
   * Imagelist pre-ingest: drop candidates whose normalized fingerprint was
   * already shown. Runs before ingestion, so repeats are not even
   * re-downloaded.
   */
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
      this.stepLogger.log(ctx, 'sanitize', 'skipped previously shown images', {
        removedCount,
        remainingCount: fresh.length,
      });
    }

    return fresh.map(({ item }) => item);
  }

  /**
   * Videolist: drop every candidate whose canonical key was recorded in the
   * registry or appeared in an earlier videolist response (legacy history).
   */
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
      this.stepLogger.log(ctx, 'sanitize', 'skipped previously shown videos', {
        removedCount,
        remainingCount: fresh.length,
      });
    }

    return fresh;
  }

  /**
   * Imagelist post-ingest: drop ingested images that were already shown —
   * registry fingerprint/storage hash or legacy history URLs. Removing them
   * from the rewrite set beforehand blanks their source URLs in the tool
   * results like any un-ingestable image.
   */
  private filterShownIngestedImages(
    ctx: HarnessContext,
    template: string | undefined,
    shownKeys: ShownMediaKeys | undefined,
    ingestion: { ingestedForRewrite: IngestedImage[] },
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
      this.stepLogger.log(ctx, 'sanitize', 'skipped previously shown images', {
        removedCount,
        remainingCount: fresh.length,
      });
    }

    return fresh;
  }

  private sanitizeToolResults(
    toolResults: Array<{ toolName: string; result: unknown }>,
  ): Array<{ toolName: string; result: unknown }> {
    return toolResults.map((tr) => ({
      toolName: tr.toolName,
      result: sanitizeToolResult(tr.toolName, tr.result),
    }));
  }

  private sanitizeToolResultsWithBrokenUrls(
    toolResults: Array<{ toolName: string; result: unknown }>,
    brokenImageUrls: Set<string>,
    brokenPageUrls: Set<string>,
  ): Array<{ toolName: string; result: unknown }> {
    return toolResults.map((tr) => ({
      toolName: tr.toolName,
      result: sanitizeToolResult(tr.toolName, tr.result, {
        brokenImageUrls,
        brokenPageUrls,
      }),
    }));
  }

  private collectImageUrls(
    toolResults: Array<{ toolName: string; result: unknown }>,
  ): string[] {
    const urls = new Set<string>();

    for (const tr of toolResults) {
      const data = tr.result as
        | {
            results?: Array<{
              imageUrl?: string;
            }>;
          }
        | undefined;
      if (!data?.results) continue;

      for (const r of data.results) {
        if (typeof r.imageUrl === 'string' && r.imageUrl.trim()) {
          urls.add(r.imageUrl.trim());
        }
      }
    }

    return Array.from(urls);
  }

  /** Thumbnail URLs on video candidates from video/web/news search results. */
  private collectVideoThumbnailUrls(
    toolResults: Array<{ toolName: string; result: unknown }>,
  ): string[] {
    const urls = new Set<string>();

    for (const tr of toolResults) {
      if (
        !tr.toolName.endsWith('VideoSearch') &&
        tr.toolName !== 'webSearch' &&
        !tr.toolName.endsWith('WebSearch') &&
        !tr.toolName.endsWith('NewsSearch')
      )
        continue;

      const data = tr.result as
        { results?: Array<{ thumbnailUrl?: string }> } | undefined;
      if (!data?.results) continue;

      for (const r of data.results) {
        if (typeof r.thumbnailUrl === 'string' && r.thumbnailUrl.trim()) {
          urls.add(r.thumbnailUrl.trim());
        }
      }
    }

    return Array.from(urls);
  }

  /** Article/page URLs from web and news search results. */
  private collectPageUrls(
    toolResults: Array<{ toolName: string; result: unknown }>,
  ): string[] {
    const urls = new Set<string>();

    for (const tr of toolResults) {
      if (
        tr.toolName !== 'webSearch' &&
        !tr.toolName.endsWith('WebSearch') &&
        !tr.toolName.endsWith('NewsSearch')
      )
        continue;

      const data = tr.result as
        { results?: Array<{ url?: string; link?: string }> } | undefined;
      if (!data?.results) continue;

      for (const r of data.results) {
        const url = [r.url, r.link].find(
          (candidate): candidate is string =>
            typeof candidate === 'string' && !!candidate.trim(),
        );
        if (url) urls.add(url.trim());
      }
    }

    return Array.from(urls);
  }

  private async findBrokenImageUrls(
    ctx: HarnessContext,
    urls: string[],
  ): Promise<Set<string>> {
    if (urls.length === 0) return new Set();

    const results = await this.mediaUrlValidator.validateUrls(urls, {
      enabled: true,
      timeoutMs: 5000,
      maxRedirects: 3,
      concurrency: 5,
      checkImageDimensions: true,
      minWidth: 1280,
      minHeight: 720,
      maxProbeBytes: 256 * 1024,
    });

    const broken = results.filter((r) => r.kind !== 'image').map((r) => r.url);

    if (broken.length > 0) {
      this.stepLogger.log(
        ctx,
        'sanitize',
        'removed broken or sub-720p image urls',
        {
          brokenCount: broken.length,
          sampledUrls: broken.slice(0, 5),
        },
      );
    }

    return new Set(broken);
  }

  /**
   * Video thumbnails are rendered small in video cards, so no dimension
   * check — the URL just has to serve an actual image.
   */
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

    const broken = results.filter((r) => r.kind !== 'image').map((r) => r.url);

    if (broken.length > 0) {
      this.stepLogger.log(ctx, 'sanitize', 'removed broken video thumbnails', {
        brokenCount: broken.length,
        sampledUrls: broken.slice(0, 5),
      });
    }

    return new Set(broken);
  }

  /**
   * Article/page URLs are only dropped on a definitive dead response
   * (status >= 400). "unknown" is kept because many sites block bot probes
   * while serving real browsers fine.
   */
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

    const broken = results.filter((r) => r.kind === 'broken').map((r) => r.url);

    if (broken.length > 0) {
      this.stepLogger.log(ctx, 'sanitize', 'removed dead article page urls', {
        brokenCount: broken.length,
        sampledUrls: broken.slice(0, 5),
      });
    }

    return new Set(broken);
  }

  private scrubBrokenUrlsFromMessages(
    messages: InputMessage[],
    brokenImageUrls: Set<string>,
  ): InputMessage[] {
    if (brokenImageUrls.size === 0) return messages;

    const replacements = Array.from(brokenImageUrls).map((url) => ({
      url,
      escaped: url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    }));

    return messages.map((message) => {
      if (typeof message.content !== 'string') return message;
      let content = message.content;
      for (const { escaped } of replacements) {
        content = content.replace(new RegExp(escaped, 'g'), ' ');
      }
      return { ...message, content };
    });
  }

  /**
   * Download verified external images into MinIO and rewrite them to local
   * storage URLs. External candidates the pipeline could not download are
   * dropped — never handed to the client as a fallback, because links that
   * answered our probes may still refuse real clients. Compare/describe
   * tasks additionally keep up to three ingested images as cloud reference
   * attachments returned in `ingestedImages`; other templates only rewrite
   * URLs, so search images never appear as user-gallery attachments.
   */
  private async ingestCloudImages(
    ctx: HarnessContext,
    verifiedImages: ExtractedImageItem[],
    imageTargetCount: number,
  ): Promise<{
    verifiedImages: ExtractedImageItem[];
    ingestedImages: SanitizeResult['ingestedImages'];
    ingestedForRewrite: NonNullable<SanitizeResult['ingestedImages']>;
  }> {
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
      const existingFingerprints = await this.buildUserFingerprints(ctx);
      const ingested =
        (await this.ingestExternalImages(
          ctx,
          sliced,
          existingFingerprints,
          CLOUD_REFERENCE_MAX_DIMENSION,
        )) ?? [];
      const ingestedForRewrite = this.limitCloudReferenceImages(ingested, 3);
      const ingestedByUrl = new Map(
        ingestedForRewrite.map((img) => [img.sourceUrl, img]),
      );

      return {
        verifiedImages: this.rewriteCandidatesWithIngested(
          sliced,
          ingestedByUrl,
        ),
        // Only image-reference tasks surface ingested images as attachments.
        ingestedImages: ingestedForRewrite,
        ingestedForRewrite,
      };
    }

    // Display path: locals always keep their slot; externals are ingested in
    // batches sized by what is still missing, so blocked hosts are replaced
    // by the next candidates instead of shrinking the gallery. Each round
    // only retries for the remaining shortfall — bounded by the batch cap.
    const locals = verifiedImages.filter(
      (item) => !item.imageUrl.startsWith('http'),
    );
    const externals = verifiedImages.filter((item) =>
      item.imageUrl.startsWith('http'),
    );
    const externalTarget = Math.max(imageTargetCount - locals.length, 0);

    const ingestedForRewrite: NonNullable<SanitizeResult['ingestedImages']> =
      [];
    let offset = 0;
    let batch = 0;
    while (
      ingestedForRewrite.length < externalTarget &&
      offset < externals.length &&
      batch < CLOUD_INGEST_MAX_BATCHES
    ) {
      const needed = externalTarget - ingestedForRewrite.length;
      const chunk = externals.slice(offset, offset + needed);
      const ingested =
        (await this.ingestExternalImages(
          ctx,
          chunk,
          [],
          CLOUD_DISPLAY_MAX_DIMENSION,
        )) ?? [];
      ingestedForRewrite.push(...ingested);
      offset += chunk.length;
      batch++;
    }

    const ingestedByUrl = new Map(
      ingestedForRewrite.map((img) => [img.sourceUrl, img]),
    );

    return {
      verifiedImages: this.rewriteCandidatesWithIngested(
        verifiedImages,
        ingestedByUrl,
      ).slice(0, imageTargetCount),
      ingestedImages: [],
      ingestedForRewrite,
    };
  }

  /**
   * Walk candidates in their original order, rewriting externals to their
   * ingested storage URL and dropping externals without an ingested match
   * (never kept as fallback). Identical storage URLs collapse once.
   */
  private rewriteCandidatesWithIngested(
    candidates: ExtractedImageItem[],
    ingestedByUrl: Map<
      string,
      NonNullable<SanitizeResult['ingestedImages']>[number]
    >,
  ): ExtractedImageItem[] {
    const rewritten: ExtractedImageItem[] = [];
    const seenUrls = new Set<string>();
    for (const item of candidates) {
      const isExternal = item.imageUrl.startsWith('http');
      const match = isExternal ? ingestedByUrl.get(item.imageUrl) : undefined;
      // Un-ingestable external images are dropped, never kept as fallback.
      if (isExternal && !match) continue;

      const finalUrl = match?.imageUrl ?? item.imageUrl;
      if (seenUrls.has(finalUrl)) continue;

      seenUrls.add(finalUrl);
      rewritten.push({
        ...item,
        imageUrl: finalUrl,
        title: match?.title ?? item.title,
        // Dimensions describe the stored (resized) image, not the origin —
        // clients badge tiles with them.
        width: match?.width ?? item.width,
        height: match?.height ?? item.height,
      });
    }
    return rewritten;
  }

  /**
   * External image URLs in image-search results that were not rewritten to
   * local storage — the client would fetch them from their origin, which
   * the pipeline could not ingest. They are blanked as broken media.
   */
  private collectExternalImageSearchUrls(
    toolResults: Array<{ toolName: string; result: unknown }>,
    ingestedForRewrite: NonNullable<SanitizeResult['ingestedImages']>,
  ): Set<string> {
    const keptUrls = new Set(ingestedForRewrite.map((img) => img.sourceUrl));
    const droppedUrls = new Set<string>();

    for (const tr of toolResults) {
      if (!tr.toolName.endsWith('ImageSearch')) continue;
      const results = (
        tr.result as { results?: Array<{ imageUrl?: string }> } | undefined
      )?.results;
      if (!Array.isArray(results)) continue;

      for (const r of results) {
        const imageUrl =
          typeof r?.imageUrl === 'string' ? r.imageUrl.trim() : '';
        if (imageUrl.startsWith('http') && !keptUrls.has(imageUrl)) {
          droppedUrls.add(imageUrl);
        }
      }
    }

    return droppedUrls;
  }

  private async buildUserFingerprints(ctx: HarnessContext): Promise<string[]> {
    const originalEntries = ctx.processedMeta
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !entry.variant || entry.variant === 'original');

    const fingerprints: string[] = [];
    for (const { entry } of originalEntries) {
      const fingerprint = entry.fingerprint;
      if (fingerprint) {
        fingerprints.push(fingerprint);
      }
    }
    return fingerprints;
  }

  private async ingestExternalImages(
    ctx: HarnessContext,
    verifiedImages: ExtractedImageItem[],
    existingFingerprints: string[],
    maxDimension: number,
  ): Promise<SanitizeResult['ingestedImages']> {
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
      { existingFingerprints, maxDimension },
    );
  }

  private buildIngestedByUrlMap(
    ingestedImages: SanitizeResult['ingestedImages'],
  ): Map<
    string,
    { imageUrl: string; title?: string; width?: number; height?: number }
  > {
    return new Map(
      (ingestedImages ?? []).map((img) => [
        img.sourceUrl,
        {
          imageUrl: img.imageUrl,
          title: img.title,
          width: img.width,
          height: img.height,
        },
      ]),
    );
  }

  private limitCloudReferenceImages(
    ingestedImages: SanitizeResult['ingestedImages'],
    maxCloud: number,
  ): SanitizeResult['ingestedImages'] {
    return (ingestedImages ?? []).slice(0, maxCloud);
  }

  /**
   * Verify media URLs against live endpoints. Broken links are dropped; type mismatches (image URL actually pointing to a video or vice versa) are re-routed.
   */
  private async filterVerifiedMedia(
    rawImages: ExtractedImageItem[],
    rawVideos: ExtractedVideoItem[],
  ): Promise<{
    images: ExtractedImageItem[];
    videos: ExtractedVideoItem[];
  }> {
    const imageUrls = rawImages.map((item) => item.imageUrl);
    const videoUrls = rawVideos.map((item) => item.videoUrl);

    const [imageResults, videoResults] = await Promise.all([
      this.mediaUrlValidator.validateUrls(imageUrls, {
        enabled: true,
        timeoutMs: 5000,
        maxRedirects: 3,
        concurrency: 5,
        checkImageDimensions: true,
        minWidth: 1280,
        minHeight: 720,
        maxProbeBytes: 256 * 1024,
      }),
      this.mediaUrlValidator.validateUrls(videoUrls, {
        enabled: true,
        timeoutMs: 3000,
        maxRedirects: 3,
        concurrency: 5,
      }),
    ]);

    const images: ExtractedImageItem[] = [];
    const videos: ExtractedVideoItem[] = [];

    for (let i = 0; i < rawImages.length; i++) {
      const item = rawImages[i];
      const result = imageResults[i];
      if (
        !result ||
        result.kind === 'broken' ||
        result.kind === 'unknown' ||
        result.kind === 'html'
      )
        continue;

      if (result.kind === 'video')
        videos.push({ videoUrl: item.imageUrl, title: item.title });
      else images.push(item);
    }

    for (let i = 0; i < rawVideos.length; i++) {
      const item = rawVideos[i];
      const result = videoResults[i];
      if (
        !result ||
        result.kind === 'broken' ||
        result.kind === 'unknown' ||
        result.kind === 'html'
      )
        continue;

      if (result.kind === 'image')
        images.push({ imageUrl: item.videoUrl, title: item.title });
      else videos.push(item);
    }

    return { images, videos };
  }
}
