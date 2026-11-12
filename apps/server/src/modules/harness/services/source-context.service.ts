import { Injectable, Logger } from '@nestjs/common';
import type {
  EncyclopediaSearchResult,
  EncyclopediaSourceDocument,
} from '@triplef/agent/schemas';
import type { ToolResult } from '@triplef/ai-sdk';
import { limitText } from '@triplef/helpers/limit-text';

import { MemoryEncyclopediaService } from '../../memory-client/services/memory-encyclopedia.service.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import {
  deriveBudgetChars,
  deriveReferenceDocChars,
} from '../configs/source-budget-config.adapter.js';
import { SourceBudgetConfigService } from '../configs/source-budget-config.service.js';
import { partitionByLanguage } from '../helpers/language/partition-by-language.helper.js';
import { tagLanguage } from '../helpers/language/tag-language.helper.js';
import {
  extractArticles,
  extractReferences,
} from '../helpers/media/extract-articles-from-tools.helper.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../helpers/media/extract-media-from-tools.types.js';
import { extractPlaces } from '../helpers/media/extract-places.helper.js';
import { extractReviews } from '../helpers/media/extract-reviews.helper.js';
import { extractShopOffers } from '../helpers/media/extract-shop-offers.helper.js';
import { applySourcePolicy } from '../helpers/sanitize/apply-source-policy.helper.js';
import { mapArticleToSearchResult } from '../helpers/sanitize/map-article-to-search-result.helper.js';
import { mapChunkToEncyclopediaPassage } from '../helpers/sanitize/map-chunk-to-encyclopedia-passage.helper.js';
import { mapChunkToReference } from '../helpers/sanitize/map-chunk-to-reference.helper.js';

import type { HarnessContext } from './harness-context.type.js';
import {
  INTERNATIONAL_ARTICLE_LIMIT,
  INTERNATIONAL_VIDEO_LIMIT,
} from './source-context.constant.js';
import type { SourceContextResult } from './source-context.service.types.js';

/** Current-turn references and recalled passages selected for the response. */
interface ReferenceSelectionContext {
  /** Normalized full references or the selector's budget-filled chunks. */
  references: SourceContextResult['references'];
  /** Selection accounting when the encyclopedia completed successfully. */
  referencesSelection?: SourceContextResult['referencesSelection'];
  /** Previously indexed passages recalled for the same query. */
  encyclopediaPassages?: SourceContextResult['encyclopediaPassages'];
}

/** Applies source policy and builds current-turn citation and language context. */
@Injectable()
export class SourceContextService {
  private readonly logger = new Logger(SourceContextService.name);

  constructor(
    private readonly memoryEncyclopedia: MemoryEncyclopediaService,
    private readonly providerOverrides: ProviderOverridesService,
    private readonly sourceBudget: SourceBudgetConfigService,
  ) {}

  /** Build source-policy-approved media, references, and supplemental tool context. */
  async buildContext(
    ctx: HarnessContext,
    toolResults: ToolResult[],
    images: ExtractedImageItem[],
    videos: ExtractedVideoItem[],
  ): Promise<SourceContextResult> {
    const sources = this.providerOverrides.getConfig().sources;
    const articles = applySourcePolicy(extractArticles(toolResults), sources);
    const searchResults = articles
      .map(mapArticleToSearchResult)
      .filter((result) => result.url && result.snippet.trim().length > 0);
    const referenceContext = await this.selectReferences(
      ctx,
      applySourcePolicy(
        extractReferences(toolResults) as Array<Record<string, unknown>>,
        sources,
      ),
      searchResults,
    );
    const sourceImages = applySourcePolicy(images, sources);
    const sourceVideos = applySourcePolicy(videos, sources);
    const shopOffers = extractShopOffers(toolResults);
    const reviews = extractReviews(toolResults);
    const places = extractPlaces(toolResults);

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

    // Foreign-language results leave the primary pools unless the request
    // explicitly targets their language. Undetermined items remain primary.
    const userLanguage = ctx.outputs.intent?.language;
    const contentLanguages = (ctx.outputs.intent?.contentLanguages ?? []).map(
      (code) => code.toLowerCase(),
    );
    await Promise.all([
      tagLanguage(
        articles,
        (article) => `${article.title ?? ''} ${article.snippet ?? ''}`,
      ),
      tagLanguage(
        sourceVideos,
        (video) => `${video.title ?? ''} ${video.description ?? ''}`,
      ),
    ]);
    const articlePool = partitionByLanguage(
      articles,
      userLanguage,
      contentLanguages,
    );
    const videoPool = partitionByLanguage(
      sourceVideos,
      userLanguage,
      contentLanguages,
    );
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
          userLang: userLanguage,
          contentLanguages,
          internationalArticleCount: internationalArticles.length,
          internationalVideoCount: internationalVideos.length,
        },
        'language partition applied',
      );
    }

    return {
      images: sourceImages,
      videos: videoPool.main,
      articles: articlePool.main,
      references: referenceContext.references,
      referencesSelection: referenceContext.referencesSelection,
      encyclopediaPassages: referenceContext.encyclopediaPassages,
      shopOffers,
      reviews,
      places,
      internationalArticles,
      internationalVideos,
    };
  }

  /**
   * Normalize and budget-cap references, then ask the encyclopedia selector
   * for relevant passages. Selection failures fall back to full normalized
   * references because memory is a background concern.
   */
  private async selectReferences(
    ctx: HarnessContext,
    references: SourceContextResult['references'],
    searchResults: EncyclopediaSearchResult[],
  ): Promise<ReferenceSelectionContext> {
    const contextWindowTokens = ctx.request.options?.num_ctx;
    const sourceBudgetConfig = this.sourceBudget.config;
    const referenceDocumentChars = deriveReferenceDocChars(
      contextWindowTokens,
      sourceBudgetConfig,
    );

    const documents: EncyclopediaSourceDocument[] = [];
    const normalized: SourceContextResult['references'] = [];
    for (const reference of references) {
      const content = reference.content ?? reference.text ?? reference.snippet;
      if (typeof content !== 'string' || !content.trim()) {
        normalized.push(reference);
        continue;
      }
      const capped = limitText(content, referenceDocumentChars);
      documents.push({
        url: typeof reference.url === 'string' ? reference.url : undefined,
        title:
          typeof reference.title === 'string' ? reference.title : undefined,
        content: capped,
      });
      normalized.push({ ...reference, content: capped });
    }

    const query =
      ctx.outputs.intent?.contextSummary?.trim() ||
      ctx.lastUserPrompt?.trim() ||
      '';
    if (!query) return { references: normalized };
    if (documents.length === 0 && searchResults.length === 0) {
      return { references: normalized };
    }

    const selection = await this.memoryEncyclopedia.selectContext({
      query,
      documents,
      searchResults,
      budgetChars: deriveBudgetChars(contextWindowTokens, sourceBudgetConfig),
      partitionScope: ctx.memoryPartition ?? ctx.sessionId ?? 'global',
      model: ctx.model,
    });
    if (!selection) {
      this.logger.warn(
        { requestId: ctx.requestId, step: 'sanitize' },
        'reference selection unavailable — falling back to full references',
      );
      return { references: normalized };
    }

    this.logger.log(
      {
        requestId: ctx.requestId,
        step: 'sanitize',
        consideredChunks: selection.consideredChunks,
        selectedChunks: selection.selectedChunks,
      },
      'reference selection applied',
    );
    return {
      references: selection.chunks.map(mapChunkToReference),
      referencesSelection: {
        considered: selection.consideredChunks,
        selected: selection.selectedChunks,
      },
      encyclopediaPassages: selection.pastChunks?.map(
        mapChunkToEncyclopediaPassage,
      ),
    };
  }
}
