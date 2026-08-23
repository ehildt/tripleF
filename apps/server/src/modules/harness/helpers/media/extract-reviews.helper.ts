import type { ExtractedReview, RawReview } from './extract-reviews.types.js';
import type { ToolEntry } from './tool-entry.types.js';

const MAX_REVIEWS = 10;

function readResults(result: unknown): RawReview[] {
  const results = (result as { results?: RawReview[] } | undefined)?.results;
  return Array.isArray(results) ? results : [];
}

function reviewKey(raw: RawReview): string {
  return `${raw.author ?? ''}:${(raw.snippet ?? '').slice(0, 60)}`;
}

function toReview(raw: RawReview): ExtractedReview {
  return {
    author: raw.author || '',
    snippet: (raw.snippet || '').slice(0, 300),
    ...(typeof raw.rating === 'number' ? { rating: raw.rating } : {}),
    ...(raw.date ? { date: raw.date } : {}),
    ...(raw.place ? { place: raw.place } : {}),
  };
}

/**
 * Extract business/place reviews from *ReviewsSearch tool results as compact,
 * labeled records for the respond step's tool context. Dedupe by author +
 * snippet prefix so distinct reviews from the same place all survive.
 */
export function extractReviews(toolResults: ToolEntry[]): ExtractedReview[] {
  const seen = new Set<string>();

  return toolResults
    .filter((tr) => tr.toolName.endsWith('ReviewsSearch'))
    .flatMap((tr) => readResults(tr.result))
    .filter((raw) => {
      if (!raw.snippet) return false;
      const key = reviewKey(raw);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_REVIEWS)
    .map(toReview);
}
