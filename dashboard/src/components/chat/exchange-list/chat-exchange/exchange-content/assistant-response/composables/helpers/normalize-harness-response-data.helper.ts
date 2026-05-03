import type {
  ArticleCard,
  GalleryItem,
  HarnessResponseData,
  KeyFinding,
  RelatedStory,
  Source,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';
import type { HarnessStreamEvent } from '@/types/harness-stream-event.model';

import { cleanHarnessResponseArrays } from './clean-harness-response-arrays.helper';
import { extractMediaFromToolResults } from './extract-media-from-tool-results.helper';
import { isMeaningfulString } from './is-meaningful-string.helper';
import { isTrustedImageUrl } from './is-trusted-image-url.helper';

export function normalizeHarnessResponseData(
  raw: unknown,
  event: HarnessStreamEvent,
): HarnessResponseData | null {
  if (!isRecord(raw)) return null;

  const data = extractData(raw);

  if (event.images?.length) {
    data.galleryItems =
      event.images as unknown as HarnessResponseData['galleryItems'];
  }

  cleanHarnessResponseArrays(data);

  if (event.toolResults?.length) {
    extractMediaFromToolResults(event.toolResults, data);
    cleanHarnessResponseArrays(data);
  }

  if (data.heroImageUrl && !isTrustedImageUrl(data.heroImageUrl)) {
    data.heroImageUrl = undefined;
  }

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
    hasItems(data.recommendations)
  );
}

function hasItems(value: unknown[] | undefined): boolean {
  return Array.isArray(value) && value.length > 0;
}
