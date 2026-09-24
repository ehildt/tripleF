import type {
  ArticleCard,
  BodySection,
  ChartMarker,
  ChartReferenceLine,
  EvaluationComparison,
  EvaluationCriterion,
  EvaluationCriterionScore,
  EvaluationSubject,
  GalleryItem,
  HarnessResponseData,
  InternationalCoverageEntry,
  KeyFinding,
  RelatedStory,
  ResponseLayout,
  ShopOffer,
  Source,
  StatHighlight,
  StockmarketFundamentals,
  StockmarketListItem,
  StockmarketNewsItem,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';
import type { HarnessStreamEvent } from '@/types/harness-stream-event.model';

import { dedupeResponseMedia } from '../media/dedupe-response-media.helper';
import { extractMediaFromToolResults } from '../media/extract-media-from-tool-results.helper';
import { isTrustedImageUrl } from '../media/is-trusted-image-url.helper';
import { mapBodySection } from './helpers/map-body-section.helper';
import { mapCriterionScore } from './helpers/map-criterion-score.helper';
import { mapEvaluationCriterion } from './helpers/map-evaluation-criterion.helper';
import { mapEvaluationSubject } from './helpers/map-evaluation-subject.helper';
import { mapKeyFinding } from './helpers/map-key-finding.helper';
import { mapStatHighlight } from './helpers/map-stat-highlight.helper';
import { cleanHarnessResponseArrays } from './clean-harness-response-arrays.helper';
import { isMeaningfulString } from './is-meaningful-string.helper';

export function normalizeHarnessResponseData(
  raw: unknown,
  event: HarnessStreamEvent,
  template?: string,
): HarnessResponseData | null {
  if (!isRecord(raw)) return null;

  const data = extractData(raw);

  migrateLegacyNewsKeyPoints(data, template ?? event.template);

  // Image-self-analysis tasks (describe/compare/ocr): the gallery is the
  // verified cloud reference images only — the user's uploaded images are
  // already rendered as message attachments and must never be merged into
  // the response gallery (or the lightbox built from it).
  const imageTaskTemplates = new Set(['describe', 'compare', 'ocr']);
  if (
    event.images?.length &&
    !imageTaskTemplates.has(template ?? event.template ?? '')
  ) {
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

const RESPONSE_LAYOUTS = new Set<ResponseLayout>([
  'classic',
  'editorial',
  'split',
  'mosaic',
]);

function normalizeLayout(raw: unknown): ResponseLayout | undefined {
  return typeof raw === 'string' && RESPONSE_LAYOUTS.has(raw as ResponseLayout)
    ? (raw as ResponseLayout)
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * News responses historically shipped their takeaways as `keyPoints`; the
 * field is now `keyFindings`, shared with article and the other text
 * templates. Persisted conversations still hold the old shape, so move
 * legacy keyPoints onto keyFindings when the news response produced none
 * of its own. Other templates keep their `keyPoints` field untouched.
 */
function migrateLegacyNewsKeyPoints(
  data: HarnessResponseData,
  template?: string,
): void {
  if (template !== 'news') return;
  if (!data.keyFindings?.length && data.keyPoints?.length) {
    data.keyFindings = data.keyPoints;
    data.keyPoints = undefined;
  }
}

function extractData(raw: Record<string, unknown>): HarnessResponseData {
  return {
    layout: normalizeLayout(raw.layout),
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
    // Merge-only fields
    bodySections: normalizeBodySections(raw.bodySections),
    // Evaluation-only fields
    subject: toOptionalString(raw.subject),
    verdict: toOptionalString(raw.verdict),
    score: typeof raw.score === 'number' ? raw.score : undefined,
    scoreLabel: toOptionalString(raw.scoreLabel),
    reasoning: toOptionalString(raw.reasoning),
    strengths: normalizeKeyFindings(raw.strengths),
    weaknesses: normalizeKeyFindings(raw.weaknesses),
    recommendations: normalizeKeyFindings(raw.recommendations),
    introduction: toOptionalString(raw.introduction),
    subjects: normalizeEvaluationSubjects(raw.subjects),
    comparison: normalizeEvaluationComparison(raw.comparison),
    // Product-only fields
    shortDescription: toOptionalString(raw.shortDescription),
    aggregateRating:
      typeof raw.aggregateRating === 'number' ? raw.aggregateRating : undefined,
    aggregateRatingCount:
      typeof raw.aggregateRatingCount === 'number'
        ? raw.aggregateRatingCount
        : undefined,
    aggregateRatingLabel: toOptionalString(raw.aggregateRatingLabel),
    statHighlights: normalizeStatHighlights(raw.statHighlights),
    pros: normalizeKeyFindings(raw.pros),
    cons: normalizeKeyFindings(raw.cons),
    shopOffers: toOptionalArray<ShopOffer>(raw.shopOffers),
    heroVideoTitle: toOptionalString(raw.heroVideoTitle),
    note: toOptionalString(raw.note),
    // Stockmarket fields — quote, recommendation, list items, chart overlays
    currentPrice:
      typeof raw.currentPrice === 'number' ? raw.currentPrice : undefined,
    change: typeof raw.change === 'number' ? raw.change : undefined,
    changeP: typeof raw.changeP === 'number' ? raw.changeP : undefined,
    recommendation: toOptionalString(raw.recommendation),
    recommendationReasoning: toOptionalString(raw.recommendationReasoning),
    fundamentals: isRecord(raw.fundamentals)
      ? (raw.fundamentals as StockmarketFundamentals)
      : undefined,
    news: toOptionalArray<StockmarketNewsItem>(raw.news),
    items: toOptionalArray<StockmarketListItem>(raw.items),
    referenceLines: toOptionalArray<ChartReferenceLine>(raw.referenceLines),
    markers: toOptionalArray<ChartMarker>(raw.markers),
  };
}

function normalizeBodySections(value: unknown): BodySection[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const sections = value
    .filter(isRecord)
    .map((item) => mapBodySection(item, toOptionalString, normalizeKeyFindings))
    .filter(
      (section) =>
        section.topic ||
        section.content ||
        section.heroImageUrl ||
        section.heroVideoUrl ||
        section.strengths?.length ||
        section.weaknesses?.length ||
        section.recommendations?.length,
    );

  return sections.length > 0 ? sections : undefined;
}

function normalizeSectionContent(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (isStringArray(value)) return value.join('\n');
  return undefined;
}

function normalizeKeyFindings(value: unknown): KeyFinding[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const findings = value.map(mapKeyFinding);

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
    .map(mapStatHighlight);

  return stats.length > 0 ? stats : undefined;
}

/**
 * Streamed deltas render before the server-side schema validation runs, so
 * subject profiles are lenient: an entry survives on a name alone and drops
 * everything malformed around it.
 */
function normalizeEvaluationSubjects(
  value: unknown,
): EvaluationSubject[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const subjects = value
    .map((item) => (typeof item === 'string' ? { name: item } : item))
    .filter(isRecord)
    .map((item) =>
      mapEvaluationSubject(item, toOptionalString, normalizeKeyFindings),
    )
    .filter((subject) => subject.name || subject.description);

  return subjects.length > 0 ? subjects : undefined;
}

function normalizeEvaluationComparison(
  value: unknown,
): EvaluationComparison | undefined {
  if (!isRecord(value)) return undefined;

  const comparison: EvaluationComparison = {
    summary: toOptionalString(value.summary),
    verdict: toOptionalString(value.verdict),
    winner: toOptionalString(value.winner),
    criteria: normalizeEvaluationCriteria(value.criteria),
  };

  if (
    !comparison.summary &&
    !comparison.verdict &&
    !comparison.winner &&
    !comparison.criteria?.length
  ) {
    return undefined;
  }

  return comparison;
}

function normalizeEvaluationCriteria(
  value: unknown,
): EvaluationCriterion[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const criteria = value
    .filter(isRecord)
    .map((item) =>
      mapEvaluationCriterion(item, toOptionalString, normalizeCriterionScores),
    )
    .filter((criterion) => criterion.name && criterion.scores?.length);

  return criteria.length > 0 ? criteria : undefined;
}

function normalizeCriterionScores(
  value: unknown,
): EvaluationCriterionScore[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const scores = value
    .filter(isRecord)
    .map((item) => mapCriterionScore(item, toOptionalString))
    .filter(
      (scoreEntry) => scoreEntry.subject && scoreEntry.score !== undefined,
    );

  return scores.length > 0 ? scores : undefined;
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
    isMeaningfulString(data.introduction) ||
    data.score !== undefined ||
    hasItems(data.subjects) ||
    data.comparison !== undefined ||
    hasItems(data.bodySections) ||
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
    isMeaningfulString(data.aggregateRatingLabel) ||
    data.aggregateRating !== undefined ||
    hasItems(data.pros) ||
    hasItems(data.cons) ||
    hasItems(data.shopOffers) ||
    hasItems(data.statHighlights) ||
    data.currentPrice !== undefined ||
    isMeaningfulString(data.recommendation) ||
    hasItems(data.news) ||
    hasItems(data.items)
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
