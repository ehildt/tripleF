import { Injectable, Logger } from '@nestjs/common';
import { isImageTaskTemplate } from '@triplef/agent/schemas';
import type { ToolResult } from '@triplef/ai-sdk';

import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { partitionByLanguage } from '../helpers/language/partition-by-language.helper.js';
import { tagLanguage } from '../helpers/language/tag-language.helper.js';
import { dedupeImagesByFingerprint } from '../helpers/media/dedupe-images-by-fingerprint.helper.js';
import {
  extractArticles,
  extractReferences,
} from '../helpers/media/extract-articles-from-tools.helper.js';
import {
  extractImageSearchItems,
  extractVideoSearchItems,
} from '../helpers/media/extract-media-from-tools.helper.js';
import { extractPlaces } from '../helpers/media/extract-places.helper.js';
import { extractReviews } from '../helpers/media/extract-reviews.helper.js';
import { extractShopOffers } from '../helpers/media/extract-shop-offers.helper.js';
import { applySourcePolicy } from '../helpers/sanitize/apply-source-policy.helper.js';
import { buildFinalMessagesForSanitize } from '../helpers/sanitize/build-final-messages.helper.js';
import { buildIngestedByUrlMap } from '../helpers/sanitize/build-ingested-by-url-map.helper.js';
import { collectExternalImageSearchUrls } from '../helpers/sanitize/collect-external-image-search-urls.helper.js';
import { collectImageUrls } from '../helpers/sanitize/collect-image-urls.helper.js';
import { collectPageUrls } from '../helpers/sanitize/collect-page-urls.helper.js';
import { collectVideoThumbnailUrls } from '../helpers/sanitize/collect-video-thumbnail-urls.helper.js';
import { sanitizeToolResultsWithIngestedUrls } from '../helpers/sanitize/sanitize-tool-result.helper.js';
import { scrubBrokenUrlsFromMessages } from '../helpers/sanitize/scrub-broken-urls-from-messages.helper.js';
import type { HarnessContext } from '../services/harness-context.type.js';
import { SanitizeCognitionContextService } from '../services/sanitize/cognition-context.service.js';
import { SanitizeImageIngestionService } from '../services/sanitize/image-ingestion.service.js';
import { SanitizeMediaValidationService } from '../services/sanitize/media-validation.service.js';
import { SanitizeReferenceSelectionService } from '../services/sanitize/reference-selection.service.js';
import { SanitizeShownMediaFilterService } from '../services/sanitize/shown-media-filter.service.js';

import { mapArticleToSearchResult } from './helpers/map-article-to-search-result.helper.js';
import { mapImageToAvailable } from './helpers/map-image-to-available.helper.js';
import { mapSanitizedToolResult } from './helpers/map-sanitized-tool-result.helper.js';
import { mapSanitizedToolResultWithBrokenUrls } from './helpers/map-sanitized-tool-result-with-broken-urls.helper.js';
import { mapVideoToAvailable } from './helpers/map-video-to-available.helper.js';
import type { SanitizeResult } from './sanitize.action.types.js';

/** International pools cap: the aside must never crowd out primary context. */
const INTERNATIONAL_ARTICLE_LIMIT = 6;
const INTERNATIONAL_VIDEO_LIMIT = 3;

/** Orchestrates the sanitize pipeline; domain work lives in focused providers. */
@Injectable()
export class SanitizeActionService {
  private readonly logger = new Logger(SanitizeActionService.name);

  constructor(
    private readonly providerOverrides: ProviderOverridesService,
    private readonly mediaValidation: SanitizeMediaValidationService,
    private readonly shownMediaFilter: SanitizeShownMediaFilterService,
    private readonly imageIngestion: SanitizeImageIngestionService,
    private readonly referenceSelection: SanitizeReferenceSelectionService,
    private readonly cognitionContext: SanitizeCognitionContextService,
  ) {}

  async execute(
    ctx: HarnessContext,
    toolResults: ToolResult[],
    buffers: Buffer[],
  ): Promise<SanitizeResult> {
    // 1. Trust-based sanitize (drop untrusted hosts, keep only embeddable videos).
    const trustSanitized = toolResults.map(mapSanitizedToolResult);

    // 2. Probe every image, thumbnail, and page URL so broken media and dead
    //    citations cannot leak into the response.
    const allImageUrls = collectImageUrls(trustSanitized);
    const videoThumbnailUrls = collectVideoThumbnailUrls(trustSanitized);
    const pageUrls = collectPageUrls(trustSanitized);
    const { mediaUrls: brokenMediaUrls, pageUrls: brokenPageUrls } =
      await this.mediaValidation.findBrokenUrls(
        ctx,
        allImageUrls,
        videoThumbnailUrls,
        pageUrls,
      );

    const sanitizedToolResults = trustSanitized.map((toolResult) =>
      mapSanitizedToolResultWithBrokenUrls(
        toolResult,
        brokenMediaUrls,
        brokenPageUrls,
      ),
    );

    // 3. Extract image/video candidates and verify them against live endpoints.
    const rawImageItems = extractImageSearchItems(sanitizedToolResults);
    const rawVideoItems = extractVideoSearchItems(sanitizedToolResults);
    let { images: verifiedImages, videos: verifiedVideos } =
      await this.mediaValidation.verifyMedia(rawImageItems, rawVideoItems);

    // 3b. Deduplicate verified images by content fingerprint.
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

    // Media-list follow-ups must never repeat media the user already saw.
    const template = ctx.outputs.intent?.template;
    const shownKeys = await this.shownMediaFilter.lookupShownKeys(
      ctx,
      template,
    );
    verifiedImages = this.shownMediaFilter.filterImageCandidates(
      ctx,
      template,
      shownKeys,
      dedupedImages,
    );
    verifiedVideos = this.shownMediaFilter.filterVideoCandidates(
      ctx,
      template,
      shownKeys,
      verifiedVideos,
    );

    // 4. Respect explicit counts from intent, falling back to configured or
    //    built-in targets for the image-analysis reference pool and galleries.
    const explicitImageCount = ctx.outputs.intent?.imageCount ?? 0;
    const isImageTemplate = isImageTaskTemplate(
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

    // 5. Ingest external images so only successfully stored URLs reach the
    //    response, then remove any ingested media already shown in history.
    const initialIngestion = await this.imageIngestion.ingestCloudImages(
      ctx,
      verifiedImages,
      imageTargetCount,
    );
    const ingestion = this.shownMediaFilter.filterIngestedImages(
      ctx,
      template,
      shownKeys,
      initialIngestion,
    );
    verifiedImages = ingestion.verifiedImages;

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

    // 5b. Rewrite ingested image URLs and blank dropped external sources.
    const finalToolResults =
      ingestion.ingestedForRewrite.length > 0 || droppedImageUrls.size > 0
        ? sanitizeToolResultsWithIngestedUrls(
            sanitizedToolResults,
            buildIngestedByUrlMap(ingestion.ingestedForRewrite),
            new Set([...brokenMediaUrls, ...droppedImageUrls]),
            brokenPageUrls,
          )
        : sanitizedToolResults;

    // 6. Build the source pools with the configured domain policy applied
    //    before the response model sees them.
    const sources = this.providerOverrides.getConfig().sources;
    const articles = applySourcePolicy(
      extractArticles(finalToolResults),
      sources,
    );
    // Search results are also offered to encyclopedia ingest triage.
    const searchResults = articles
      .map(mapArticleToSearchResult)
      .filter((result) => result.url && result.snippet.trim().length > 0);
    const {
      references,
      selection: referencesSelection,
      encyclopediaPassages,
    } = await this.referenceSelection.selectReferences(
      ctx,
      applySourcePolicy(
        extractReferences(finalToolResults) as Array<Record<string, unknown>>,
        sources,
      ),
      searchResults,
    );
    verifiedImages = applySourcePolicy(verifiedImages, sources);
    verifiedVideos = applySourcePolicy(verifiedVideos, sources);
    const shopOffers = extractShopOffers(finalToolResults);
    const reviews = extractReviews(finalToolResults);
    const places = extractPlaces(finalToolResults);

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'sanitize',
        shopOfferCount: shopOffers.length,
        reviewCount: reviews.length,
        placeCount: places.length,
      },
      'shop data extracted',
    );

    // 7. Partition foreign-language articles/videos into the international
    //    aside unless the request explicitly targets that language.
    const userLang = ctx.outputs.intent?.language;
    const contentLanguages = (ctx.outputs.intent?.contentLanguages ?? []).map(
      (code) => code.toLowerCase(),
    );
    await Promise.all([
      tagLanguage(
        articles,
        (article) => `${article.title ?? ''} ${article.snippet ?? ''}`,
      ),
      tagLanguage(
        verifiedVideos,
        (video) => `${video.title ?? ''} ${video.description ?? ''}`,
      ),
    ]);
    const articlePool = partitionByLanguage(
      articles,
      userLang,
      contentLanguages,
    );
    const videoPool = partitionByLanguage(
      verifiedVideos,
      userLang,
      contentLanguages,
    );
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
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'sanitize',
          userLang,
          contentLanguages,
          internationalArticleCount: internationalArticles.length,
          internationalVideoCount: internationalVideos.length,
        },
        'language partition applied',
      );
    }

    const {
      profile: cognitionProfile,
      persona: cognitionPersona,
      corrections: cognitionCorrections,
      insights: cognitionInsights,
      convictions: cognitionConvictions,
      episodes: cognitionEpisodes,
      clusters: cognitionClusters,
    } = await this.cognitionContext.getContext(ctx);

    const messages = scrubBrokenUrlsFromMessages(
      buildFinalMessagesForSanitize(
        ctx,
        buffers,
        finalToolResults,
        verifiedImages,
        verifiedVideos,
        mainArticles,
        references,
        referencesSelection,
        encyclopediaPassages,
        shopOffers,
        reviews,
        places,
        internationalArticles,
        internationalVideos,
        cognitionProfile,
        cognitionPersona,
        cognitionCorrections,
        cognitionInsights,
        cognitionConvictions,
        cognitionEpisodes,
        cognitionClusters,
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
      // Client fallback uses the same fresh, deduplicated media as the model.
      availableImages: verifiedImages.map(mapImageToAvailable),
      availableVideos: verifiedVideos.map(mapVideoToAvailable),
    };
  }
}
