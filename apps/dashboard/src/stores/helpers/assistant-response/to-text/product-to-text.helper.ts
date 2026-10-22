import { appendLabeledFields } from '@/stores/helpers/assistant-response/sources/append-labeled-fields.helper';
import { appendList } from '@/stores/helpers/assistant-response/sources/append-list.helper';
import { buildShopOffersLines } from '@/stores/helpers/assistant-response/sources/build-shop-offers-lines.helper';
import { buildSourcesLines } from '@/stores/helpers/assistant-response/sources/build-sources-lines.helper';
import type { AssistantResponseData } from '@/types/assistant-response-data.model';

/**
 * Convert a product response into plain text for the model history.
 * Prices, offers, and review consensus are the decision-relevant content for
 * follow-ups; media galleries are omitted.
 */
export function productToText(data: AssistantResponseData): string {
  const parts: string[] = [];

  appendLabeledFields(parts, [
    ['Category', data.category],
    ['Title', data.title],
    ['Subtitle', data.subtitle],
  ]);

  if (data.shortDescription?.trim()) parts.push(data.shortDescription.trim());

  const rating = formatAggregateRating(data);
  if (rating) parts.push(rating);

  appendStatHighlights(parts, data.statHighlights);
  appendList(parts, 'Pros:', data.pros);
  appendList(parts, 'Cons:', data.cons);
  parts.push(...buildShopOffersLines(data.shopOffers));
  appendList(parts, 'Key points:', data.keyPoints);
  parts.push(...buildSourcesLines(data.sources));

  return parts.join('\n\n');
}

/** "Aggregate rating: 4.6 (12840 reviews) — Excellent"; undefined if absent. */
function formatAggregateRating(
  data: AssistantResponseData,
): string | undefined {
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
  highlights: AssistantResponseData['statHighlights'],
): void {
  if (!highlights?.length) return;
  parts.push(
    `Stat highlights: ${highlights
      .map((stat) => `${stat.label}: ${stat.value}`)
      .join(', ')}`,
  );
}
