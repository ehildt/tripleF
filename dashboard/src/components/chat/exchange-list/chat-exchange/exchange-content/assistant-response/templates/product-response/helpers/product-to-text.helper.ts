import type {
  HarnessResponseData,
  ShopOffer,
} from '@/types/harness-response-data.model';

import { appendLabeledFields } from '../../../composables/helpers/append-labeled-fields.helper';
import { buildSourcesLines } from '../../../composables/helpers/build-sources-lines.helper';

function appendList(
  parts: string[],
  title: string,
  items?: Array<{ text?: string }>,
): void {
  if (!items?.length) return;
  parts.push(title);
  for (const item of items) {
    const text = item.text?.trim();
    if (text) parts.push(`- ${text}`);
  }
}

function buildShopOfferLine(offer: ShopOffer): string | undefined {
  const label = [offer.title, offer.price, offer.source]
    .filter(Boolean)
    .join(' — ');
  if (!label) return undefined;
  const rating =
    typeof offer.rating === 'number' ? ` — rating ${offer.rating}` : '';
  const linkPart = offer.link ? ` (${offer.link})` : '';
  return `- ${label}${rating}${linkPart}`;
}

/**
 * Convert a product response into plain text for the model history.
 * Prices, offers, and review consensus are the decision-relevant content for
 * follow-ups; media galleries are omitted.
 */
export function productToText(data: HarnessResponseData): string {
  const parts: string[] = [];

  appendLabeledFields(parts, [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
  ]);

  if (data.shortDescription?.trim()) parts.push(data.shortDescription.trim());

  const priceRange = data.priceRange?.trim();
  if (priceRange) parts.push(`Price range: ${priceRange}`);

  const rating = formatAggregateRating(data);
  if (rating) parts.push(rating);

  const buyAdvice = data.buyAdvice?.trim();
  if (buyAdvice) parts.push(`Buy advice: ${buyAdvice}`);

  appendStatHighlights(parts, data.statHighlights);
  appendList(parts, 'Pros:', data.pros);
  appendList(parts, 'Cons:', data.cons);
  appendShopOffers(parts, data.shopOffers);
  appendList(parts, 'Review summary:', data.reviewSummary);
  appendList(parts, 'Key points:', data.keyPoints);
  parts.push(...buildSourcesLines(data.sources));

  return parts.join('\n\n');
}

/** "Aggregate rating: 4.6 (12840 reviews) — Excellent"; undefined if absent. */
function formatAggregateRating(data: HarnessResponseData): string | undefined {
  if (data.aggregateRating === undefined) return undefined;
  const count = data.aggregateRatingCount
    ? ` (${data.aggregateRatingCount} reviews)`
    : '';
  const label = data.aggregateRatingLabel?.trim()
    ? ` — ${data.aggregateRatingLabel.trim()}`
    : '';
  return `Aggregate rating: ${data.aggregateRating}${count}${label}`;
}

function appendStatHighlights(
  parts: string[],
  highlights: HarnessResponseData['statHighlights'],
): void {
  if (!highlights?.length) return;
  parts.push(
    `Stat highlights: ${highlights
      .map((stat) => `${stat.label}: ${stat.value}`)
      .join(', ')}`,
  );
}

function appendShopOffers(
  parts: string[],
  offers: HarnessResponseData['shopOffers'],
): void {
  if (!offers?.length) return;
  const lines = offers
    .map(buildShopOfferLine)
    .filter((line): line is string => !!line);
  if (lines.length) parts.push('Shop offers:', ...lines);
}
