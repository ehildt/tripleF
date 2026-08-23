import { Injectable } from '@nestjs/common';

import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import type { ToolResult } from '../../ai-sdk/types/ai-sdk-params.types.js';
import { INSIGHT_TAGS } from '../../memory-client/constants/memory-client.constants.js';
import { MemoryClientService } from '../../memory-client/services/memory-client.service.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { flattenProfilePaths } from '../helpers/cognition/flatten-profile-paths.helper.js';
import { matchProfilePaths } from '../helpers/cognition/match-profile-paths.helper.js';
import { partitionByLanguage } from '../helpers/language/partition-by-language.helper.js';
import { tagLanguage } from '../helpers/language/tag-language.helper.js';
import { dedupeImagesByFingerprint } from '../helpers/media/dedupe-images-by-fingerprint.helper.js';
import type { FingerprintedImageItem } from '../helpers/media/dedupe-images-by-fingerprint.types.js';
import type { IngestedImage } from '../helpers/media/download-and-ingest-images.types.js';
import {
  extractArticles,
  extractReferences,
} from '../helpers/media/extract-articles-from-tools.helper.js';
import {
  extractImageSearchItems,
  extractVideoSearchItems,
} from '../helpers/media/extract-media-from-tools.helper.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../helpers/media/extract-media-from-tools.types.js';
import { extractPlaces } from '../helpers/media/extract-places.helper.js';
import { extractReviews } from '../helpers/media/extract-reviews.helper.js';
import { extractShopOffers } from '../helpers/media/extract-shop-offers.helper.js';
import { IMAGE_TEMPLATES } from '../helpers/respond/build-execution-messages.helper.js';
import { applySourcePolicy } from '../helpers/sanitize/apply-source-policy.helper.js';
import { buildFinalMessagesForSanitize } from '../helpers/sanitize/build-final-messages.helper.js';
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
import { rewriteCandidatesWithIngested } from '../helpers/sanitize/rewrite-candidates-with-ingested.helper.js';
import {
  sanitizeToolResult,
  sanitizeToolResultsWithIngestedUrls,
} from '../helpers/sanitize/sanitize-tool-result.helper.js';
import { scrubBrokenUrlsFromMessages } from '../helpers/sanitize/scrub-broken-urls-from-messages.helper.js';
import { videoUrlKeys } from '../helpers/url-trust/video-url-keys.helper.js';
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
  toolResults: ToolResult[];
  messages: InputMessage[];
  availableImageCount: number;
  availableVideoCount: number;
  ingestedImages?: IngestedImage[];
  /** All cloud images ingested for URL rewriting — respond maps their
   *  fingerprints when recording shown media. */
  ingestedForRewrite?: IngestedImage[];
  /** Model-visible (deduped) media URLs the client may render/fall back to.
   *  Cross-request repeats are already removed, so the client shows exactly
   *  what the model was given — no re-displaying previously-shown media. */
  availableImages?: Array<{ url: string; title?: string }>;
  availableVideos?: Array<{ url: string; title?: string }>;
};

/**
 * Cloud reference candidates for vision tasks (compare/describe) are fed to
 * the response model as pixels and stored/shown at the resolution the
 * effective preprocessing (pproc) config resolves — there is no cloud-only
 * hardcoded size; ingest honors the same live SysCtl resize as uploads and
 * rejects sources smaller than that target instead of storing them visibly
 * small.
 *
 * Image-ingestion rounds per request: round N only retries for the images
 * still missing below the target, so 3 rounds cover heavy hotlink-blocking
 * without unbounded download loops.
 */
const CLOUD_INGEST_MAX_BATCHES = 3;
/** International pools cap: the aside must never crowd out primary context. */
const INTERNATIONAL_ARTICLE_LIMIT = 6;
const INTERNATIONAL_VIDEO_LIMIT = 3;

/** Topic-probe fan-out: at most this many derived insights enter the respond context. */
const COGNITION_PROBE_LIMIT = 3;

@Injectable()
export class SanitizeActionService {
  constructor(
    private readonly mediaUrlValidator: MediaUrlValidatorService,
    private readonly cloudImageIngestion: CloudImageIngestionService,
    private readonly stepLogger: HarnessStepLogger,
    private readonly providerOverrides: ProviderOverridesService,
    private readonly shownMedia: ShownMediaService,
    private readonly sharpService: SharpService,
    private readonly memoryClient: MemoryClientService,
  ) {}

  async execute(
    ctx: HarnessContext,
    toolResults: ToolResult[],
    buffers: Buffer[],
  ): Promise<SanitizeResult> {
    // 1. Trust-based sanitize (drop untrusted hosts, keep only embeddable videos).
    const trustSanitized = this.sanitizeToolResults(toolResults);

    // 2. Collect every URL that appears anywhere in the tool results and ping
    //    each one. This covers ImageSearch URLs, article thumbnails embedded in
    //    *WebSearch/NewsSearch results, video thumbnails, and the article/page
    //    URLs themselves, so broken media and dead citations cannot leak into
    //    the response.
    const allImageUrls = collectImageUrls(trustSanitized);
    const videoThumbnailUrls = collectVideoThumbnailUrls(trustSanitized);
    const pageUrls = collectPageUrls(trustSanitized);

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
      await filterVerifiedMedia(
        this.mediaUrlValidator,
        rawImageItems,
        rawVideoItems,
        this.sharpService.effectiveResize(),
      );

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

    // 4. Respect explicit counts from intent (default: configured target for
    //    the image-analysis templates' reference pool, 6 elsewhere).
    const explicitImageCount = ctx.outputs.intent?.imageCount ?? 0;
    const isImageTemplate = IMAGE_TEMPLATES.includes(
      ctx.outputs.intent?.template ?? '',
    );
    const imageTargetCount =
      explicitImageCount > 0
        ? explicitImageCount
        : isImageTemplate
          ? this.providerOverrides.getConfig().sources.imageTaskReferenceCount
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

    const droppedImageUrls = collectExternalImageSearchUrls(
      sanitizedToolResults,
      (ingestion.ingestedForRewrite ?? []).map((img) => img.sourceUrl),
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
            buildIngestedByUrlMap(ingestion.ingestedForRewrite),
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

    // The AI's cognition of this user is always-on context for the respond
    // step: the structured profile always, probed insights when the current
    // prompt matches a profile path (likes.cars, interests.ai, …) or embeds
    // near one. Read failures degrade to no injection, never to a failed
    // turn — personalization is a bonus layer.
    const { profile: cognitionProfile, insights: cognitionInsights } =
      await this.getCognitionContext(ctx);

    const messages = scrubBrokenUrlsFromMessages(
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
        cognitionProfile,
        cognitionInsights,
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
      // The client's media fallback must use the same deduped set the model
      // was given — not the raw tool results — so previously-shown media is
      // never re-displayed and the model's "no new media" is honoured.
      availableImages: verifiedImages.map((item) => ({
        url: item.imageUrl,
        title: item.title,
      })),
      availableVideos: verifiedVideos.map((item) => ({
        url: item.videoUrl,
        title: item.title,
      })),
    };
  }

  /**
   * The AI's cognition of this user, once per respond: the structured
   * profile (always-on) plus probed insights (topic-triggered). The profile
   * doubles as the routing map — profile values that token-match the prompt
   * ("cars" hits `likes.cars`) sharpen the insight query for that facet.
   * The existence check keeps cold spaces off the embed round-trip entirely.
   * Silent no-op on any failure — personalization must never fail a turn.
   */
  private async getCognitionContext(ctx: HarnessContext): Promise<{
    profile?: string;
    insights: string[];
  }> {
    const cognitionKey =
      ctx.memoryCognition ?? ctx.memoryPartition ?? ctx.sessionId;
    if (!cognitionKey) return { insights: [] };
    try {
      const snapshot = await this.memoryClient.getCognition(cognitionKey);
      const profile = snapshot.profile
        ? (JSON.parse(snapshot.profile) as Record<string, unknown> | undefined)
        : undefined;
      const prompt = ctx.lastUserPrompt?.trim();
      const profileText = snapshot.profile ?? undefined;
      if (!prompt || snapshot.insights.length === 0) {
        return { profile: profileText, insights: [] };
      }

      // The stored document is a Postgres JSONB row — already parsed, so
      // probe shaping uses the object directly (no text round-trip).
      const matched = matchProfilePaths(prompt, flattenProfilePaths(profile));
      const query =
        matched.length > 0
          ? `${prompt}\nUser profile signals: ${matched.map((m) => `${m.path}: ${m.value}`).join('; ')}`
          : prompt;

      // The cognition-lane probe never carries a partition — insight records
      // are tag-addressed ([cognition, insight]), matching the pre-split
      // in-process behavior.
      const hits = await this.memoryClient.searchByText({
        text: query,
        tags: [...INSIGHT_TAGS],
        limit: COGNITION_PROBE_LIMIT,
      });
      return { profile: profileText, insights: hits.map((hit) => hit.text) };
    } catch {
      return { insights: [] };
    }
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

  private sanitizeToolResults(toolResults: ToolResult[]): ToolResult[] {
    return toolResults.map((tr) => ({
      toolName: tr.toolName,
      result: sanitizeToolResult(tr.toolName, tr.result),
    }));
  }

  private sanitizeToolResultsWithBrokenUrls(
    toolResults: ToolResult[],
    brokenImageUrls: Set<string>,
    brokenPageUrls: Set<string>,
  ): ToolResult[] {
    return toolResults.map((tr) => ({
      toolName: tr.toolName,
      result: sanitizeToolResult(tr.toolName, tr.result, {
        brokenImageUrls,
        brokenPageUrls,
      }),
    }));
  }

  private async findBrokenImageUrls(
    ctx: HarnessContext,
    entries: ImageUrlEntry[],
  ): Promise<Set<string>> {
    if (entries.length === 0) return new Set();

    // Strict entries must be real images at or above the configured pproc
    // resize dimensions; Bright Data images only need to be real and
    // reachable (we trust its Google-side size filter).
    const strictUrls = entries
      .filter((entry) => !entry.skipDimensionCheck)
      .map((entry) => entry.url);
    const skipDimUrls = entries
      .filter((entry) => entry.skipDimensionCheck)
      .map((entry) => entry.url);
    const resizeFloor = this.sharpService.effectiveResize();

    const [strictResults, skipDimResults] = await Promise.all([
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
      skipDimUrls.length > 0
        ? this.mediaUrlValidator.validateUrls(skipDimUrls, {
            enabled: true,
            timeoutMs: 5000,
            maxRedirects: 3,
            concurrency: 5,
            checkImageDimensions: false,
          })
        : Promise.resolve([]),
    ]);

    const broken = [
      ...strictResults.filter((r) => r.kind !== 'image'),
      ...skipDimResults.filter((r) => r.kind !== 'image'),
    ].map((r) => r.url);

    if (broken.length > 0) {
      this.stepLogger.log(
        ctx,
        'sanitize',
        'removed broken or undersized image urls',
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

  /**
   * Download verified external images into MinIO and rewrite them to local
   * storage URLs. External candidates the pipeline could not download are
   * dropped — never handed to the client as a fallback, because links that
   * answered our probes may still refuse real clients. Compare/describe
   * tasks additionally keep every ingested image as a cloud reference
   * attachment returned in `ingestedImages`; other templates only rewrite
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
      const existingFingerprints = buildUserFingerprints(ctx.processedMeta);
      // keepBuffers: the reference candidates feed the response model
      // visually, so the resized bytes travel with the ingested entry.
      const ingested =
        (await this.ingestExternalImages(
          ctx,
          sliced,
          existingFingerprints,
          true,
        )) ?? [];
      const ingestedForRewrite = ingested;
      const ingestedByUrl = new Map(
        ingestedForRewrite.map((img) => [img.sourceUrl, img]),
      );

      return {
        verifiedImages: rewriteCandidatesWithIngested(sliced, ingestedByUrl),
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
      const ingested = (await this.ingestExternalImages(ctx, chunk, [])) ?? [];
      ingestedForRewrite.push(...ingested);
      offset += chunk.length;
      batch++;
    }

    const ingestedByUrl = new Map(
      ingestedForRewrite.map((img) => [img.sourceUrl, img]),
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
      { existingFingerprints, keepBuffers },
    );
  }
}
