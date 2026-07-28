import type {
  HarnessResponseData,
  ShopOffer,
} from '@/types/harness-response-data.model';

import { buildSourceLine } from '../../../composables/helpers/build-source-line.helper';

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

  const fields: Array<[string, string | undefined]> = [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
  ];
  for (const [label, value] of fields) {
    const trimmed = value?.trim();
    if (trimmed) parts.push(`${label}: ${trimmed}`);
  }

  if (data.shortDescription?.trim()) parts.push(data.shortDescription.trim());

  const priceRange = data.priceRange?.trim();
  if (priceRange) parts.push(`Price range: ${priceRange}`);

  if (data.aggregateRating !== undefined) {
    const count = data.aggregateRatingCount
      ? ` (${data.aggregateRatingCount} reviews)`
      : '';
    const label = data.aggregateRatingLabel?.trim()
      ? ` — ${data.aggregateRatingLabel.trim()}`
      : '';
    parts.push(`Aggregate rating: ${data.aggregateRating}${count}${label}`);
  }

  const buyAdvice = data.buyAdvice?.trim();
  if (buyAdvice) parts.push(`Buy advice: ${buyAdvice}`);

  if (data.statHighlights?.length) {
    parts.push(
      `Stat highlights: ${data.statHighlights
        .map((stat) => `${stat.label}: ${stat.value}`)
        .join(', ')}`,
    );
  }

  appendList(parts, 'Pros:', data.pros);
  appendList(parts, 'Cons:', data.cons);

  if (data.shopOffers?.length) {
    const lines = data.shopOffers
      .map(buildShopOfferLine)
      .filter((line): line is string => !!line);
    if (lines.length) parts.push('Shop offers:', ...lines);
  }

  appendList(parts, 'Review summary:', data.reviewSummary);
  appendList(parts, 'Key points:', data.keyPoints);

  if (data.sources?.length) {
    parts.push('Sources:');
    for (const source of data.sources) parts.push(buildSourceLine(source));
  }

  return parts.join('\n\n');
}
