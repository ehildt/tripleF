import type {
  ArticleCard,
  GalleryItem,
  HarnessResponseData,
  InternationalCoverageEntry,
  KeyFinding,
  RelatedStory,
  ReviewSummary,
  ShopOffer,
  Source,
  StatHighlight,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';
import type { HarnessStreamEvent } from '@/types/harness-stream-event.model';

import { cleanHarnessResponseArrays } from './clean-harness-response-arrays.helper';
import { dedupeResponseMedia } from './dedupe-response-media.helper';
import { extractMediaFromToolResults } from './extract-media-from-tool-results.helper';
import { isMeaningfulString } from './is-meaningful-string.helper';
import { isTrustedImageUrl } from './is-trusted-image-url.helper';

export function normalizeHarnessResponseData(
  raw: unknown,
  event: HarnessStreamEvent,
  template?: string,
): HarnessResponseData | null {
  if (!isRecord(raw)) return null;

  const data = extractData(raw);

  if (event.images?.length) {
    const uploaded = event.images as unknown as GalleryItem[];
    data.galleryItems = mergeGalleryItems(uploaded, data.galleryItems ?? []);
  }

  cleanHarnessResponseArrays(data);

  if (
    event.toolResults?.length ||
    event.availableVideos ||
    event.availableImages
  ) {
    extractMediaFromToolResults(
      event.toolResults ?? [],
      data,
      template ?? event.template,
      event.availableImages,
      event.availableVideos,
    );
    cleanHarnessResponseArrays(data);
  }

  if (data.heroImageUrl && !isTrustedImageUrl(data.heroImageUrl)) {
    data.heroImageUrl = undefined;
  }

  // Run after the hero trust check: a hero that survives may keep gallery
  // entries out, a hero that was cleared must not strip gallery content.
  dedupeResponseMedia(data);

  if (!hasAnyContent(data)) return null;

  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function extractData(raw: Record<string, unknown>): HarnessResponseData {
  return {
    headline: toOptionalString(raw.headline),
    deck: toOptionalString(raw.deck),
    lead: toOptionalString(raw.lead),
    dateline: toOptionalString(raw.dateline),
    byline: toOptionalString(raw.byline),
    keyPoints: normalizeKeyFindings(raw.keyPoints),
    relatedStories: toOptionalArray<RelatedStory>(raw.relatedStories),
    internationalCoverage: toOptionalArray<InternationalCoverageEntry>(
      raw.internationalCoverage,
    ),
    category: toOptionalString(raw.category),
    title: toOptionalString(raw.title),
    subtitle: toOptionalString(raw.subtitle),
    text: toOptionalString(raw.text),
    sectionTitle: toOptionalString(raw.sectionTitle),
    sectionContent: normalizeSectionContent(raw.sectionContent),
    galleryTitle: toOptionalString(raw.galleryTitle),
    galleryItems: toOptionalArray<GalleryItem>(raw.galleryItems),
    keyFindings: normalizeKeyFindings(raw.keyFindings),
    sources: toOptionalArray<Source>(raw.sources),
    author: toOptionalString(raw.author),
    publishDate: toOptionalString(raw.publishDate),
    readTime: toOptionalString(raw.readTime),
    heroImageUrl: toOptionalString(raw.heroImageUrl),
    heroImageAlt: toOptionalString(raw.heroImageAlt),
    heroCaption: toOptionalString(raw.heroCaption),
    heroVideoUrl: toOptionalString(raw.heroVideoUrl),
    heroVideoCaption: toOptionalString(raw.heroVideoCaption),
    summary: toOptionalString(raw.summary),
    quote: toOptionalString(raw.quote),
    conclusion: toOptionalString(raw.conclusion),
    cardsTitle: toOptionalString(raw.cardsTitle),
    cards: toOptionalArray<ArticleCard>(raw.cards),
    videoGalleryTitle: toOptionalString(raw.videoGalleryTitle),
    videoGalleryItems: toOptionalArray<VideoGalleryItem>(raw.videoGalleryItems),
    // Evaluation-only fields
    subject: toOptionalString(raw.subject),
    verdict: toOptionalString(raw.verdict),
    score: typeof raw.score === 'number' ? raw.score : undefined,
    scoreLabel: toOptionalString(raw.scoreLabel),
    reasoning: toOptionalString(raw.reasoning),
    strengths: normalizeKeyFindings(raw.strengths),
    weaknesses: normalizeKeyFindings(raw.weaknesses),
    recommendations: normalizeKeyFindings(raw.recommendations),
    // Product-only fields
    shortDescription: toOptionalString(raw.shortDescription),
    priceRange: toOptionalString(raw.priceRange),
    aggregateRating:
      typeof raw.aggregateRating === 'number' ? raw.aggregateRating : undefined,
    aggregateRatingCount:
      typeof raw.aggregateRatingCount === 'number'
        ? raw.aggregateRatingCount
        : undefined,
    aggregateRatingLabel: toOptionalString(raw.aggregateRatingLabel),
    buyAdvice: toOptionalString(raw.buyAdvice),
    statHighlights: normalizeStatHighlights(raw.statHighlights),
    pros: normalizeKeyFindings(raw.pros),
    cons: normalizeKeyFindings(raw.cons),
    shopOffers: toOptionalArray<ShopOffer>(raw.shopOffers),
    reviewSummary: toOptionalArray<ReviewSummary>(raw.reviewSummary),
    heroVideoTitle: toOptionalString(raw.heroVideoTitle),
    note: toOptionalString(raw.note),
  };
}

function normalizeSectionContent(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (isStringArray(value)) return value.join('\n');
  return undefined;
}

function normalizeKeyFindings(value: unknown): KeyFinding[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const findings = value.map((item) => {
    if (typeof item === 'string') return { text: item };
    if (isRecord(item) && typeof item.text === 'string') {
      return { text: item.text };
    }
    return { text: String(item) };
  });

  return findings;
}

function normalizeStatHighlights(value: unknown): StatHighlight[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const stats = value
    .filter(
      (item): item is Record<string, unknown> =>
        isRecord(item) &&
        typeof item.label === 'string' &&
        item.label.trim().length > 0 &&
        typeof item.value === 'string' &&
        item.value.trim().length > 0,
    )
    .map((item) => ({
      label: (item.label as string).trim(),
      value: (item.value as string).trim(),
    }));

  return stats.length > 0 ? stats : undefined;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => typeof v === 'string')
  );
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  return undefined;
}

function toOptionalArray<T>(value: unknown): T[] | undefined {
  if (Array.isArray(value) && value.length > 0) return value as T[];
  return undefined;
}

function hasAnyContent(data: HarnessResponseData): boolean {
  return (
    isMeaningfulString(data.category) ||
    isMeaningfulString(data.title) ||
    isMeaningfulString(data.subtitle) ||
    isMeaningfulString(data.text) ||
    isMeaningfulString(data.sectionTitle) ||
    isMeaningfulString(data.sectionContent) ||
    isMeaningfulString(data.galleryTitle) ||
    isMeaningfulString(data.author) ||
    isMeaningfulString(data.publishDate) ||
    isMeaningfulString(data.readTime) ||
    isMeaningfulString(data.heroImageUrl) ||
    isMeaningfulString(data.heroVideoUrl) ||
    isMeaningfulString(data.summary) ||
    isMeaningfulString(data.quote) ||
    isMeaningfulString(data.conclusion) ||
    isMeaningfulString(data.cardsTitle) ||
    isMeaningfulString(data.headline) ||
    isMeaningfulString(data.deck) ||
    isMeaningfulString(data.lead) ||
    isMeaningfulString(data.dateline) ||
    isMeaningfulString(data.byline) ||
    isMeaningfulString(data.subject) ||
    isMeaningfulString(data.verdict) ||
    isMeaningfulString(data.scoreLabel) ||
    isMeaningfulString(data.reasoning) ||
    data.score !== undefined ||
    hasItems(data.galleryItems) ||
    hasItems(data.keyFindings) ||
    hasItems(data.sources) ||
    hasItems(data.cards) ||
    hasItems(data.relatedStories) ||
    hasItems(data.videoGalleryItems) ||
    hasItems(data.strengths) ||
    hasItems(data.weaknesses) ||
    hasItems(data.recommendations) ||
    isMeaningfulString(data.shortDescription) ||
    isMeaningfulString(data.priceRange) ||
    isMeaningfulString(data.aggregateRatingLabel) ||
    isMeaningfulString(data.buyAdvice) ||
    data.aggregateRating !== undefined ||
    hasItems(data.pros) ||
    hasItems(data.cons) ||
    hasItems(data.shopOffers) ||
    hasItems(data.reviewSummary) ||
    hasItems(data.statHighlights)
  );
}

function hasItems(value: unknown[] | undefined): boolean {
  return Array.isArray(value) && value.length > 0;
}

function mergeGalleryItems(
  uploaded: GalleryItem[],
  modelItems: GalleryItem[],
): GalleryItem[] {
  const seen = new Set<string>();
  const result: GalleryItem[] = [];

  for (const item of uploaded) {
    if (item.imageUrl && !seen.has(item.imageUrl)) {
      seen.add(item.imageUrl);
      result.push(item);
    }
  }

  for (const item of modelItems) {
    if (item.imageUrl && !seen.has(item.imageUrl)) {
      // Skip external URLs that point at the same basename as an already-kept storage URL.
      // This prevents duplicates when the server ingested an external image and now both
      // the storage URL and the original external URL appear in the response.
      const basename = item.imageUrl.split('/').pop()?.split('?')[0];
      const isDuplicateBasename =
        basename &&
        item.imageUrl.startsWith('http') &&
        result.some(
          (existing) =>
            existing.imageUrl.startsWith('/') &&
            existing.imageUrl.split('/').pop()?.split('?')[0] === basename,
        );
      if (isDuplicateBasename) continue;

      seen.add(item.imageUrl);
      result.push(item);
    }
  }

  return result;
}
