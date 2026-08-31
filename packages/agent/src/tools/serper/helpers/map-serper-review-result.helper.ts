import type { SerperBusinessReviewsSearchResponse } from '../business-reviews-search.types.js';

type SerperReviewItem = NonNullable<SerperBusinessReviewsSearchResponse['reviews']>[number];

/** Normalize a Serper review item into the reviews-search result shape. */
export function mapSerperReviewResult(r: SerperReviewItem, placeName: string) {
  return {
    author: r.user?.name || '',
    snippet: r.snippet || '',
    rating: r.rating,
    date: r.isoDate || r.date || '',
    likes: r.likes ?? 0,
    place: placeName,
  };
}
