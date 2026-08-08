import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { appendLabeledFields } from '../../../composables/helpers/sources/append-labeled-fields.helper';
import { appendList } from '../../../composables/helpers/sources/append-list.helper';
import { buildShopOffersLines } from '../../../composables/helpers/sources/build-shop-offers-lines.helper';
import { buildSourcesLines } from '../../../composables/helpers/sources/build-sources-lines.helper';

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
