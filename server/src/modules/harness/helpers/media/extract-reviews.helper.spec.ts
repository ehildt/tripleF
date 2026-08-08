import { describe, expect, it } from 'vitest';

import { extractReviews } from './extract-reviews.helper.js';

const tool = (toolName: string, results: unknown[]) => ({
  toolName,
  result: { results },
});

describe('extractReviews', () => {
  it('extracts reviews from ReviewsSearch results', () => {
    const result = extractReviews([
      tool('serperBusinessReviewsSearch', [
        { author: 'A', snippet: 'Great', rating: 5 },
      ]),
    ]);
    expect(result).toEqual([{ author: 'A', snippet: 'Great', rating: 5 }]);
  });

  it('ignores non-reviews tools', () => {
    const result = extractReviews([
      tool('serperWebSearch', [{ author: 'A', snippet: 'Great' }]),
    ]);
    expect(result).toEqual([]);
  });

  it('dedupes by author and snippet prefix', () => {
    const result = extractReviews([
      tool('serperBusinessReviewsSearch', [
        { author: 'A', snippet: 'Great product' },
        { author: 'A', snippet: 'Great product' },
      ]),
    ]);
    expect(result).toHaveLength(1);
  });

  it('drops reviews without a snippet', () => {
    const result = extractReviews([
      tool('serperBusinessReviewsSearch', [{ author: 'A' }]),
    ]);
    expect(result).toEqual([]);
  });
});
