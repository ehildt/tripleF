import { describe, expect, it } from 'vitest';

import { mapSerperReviewResult } from './map-serper-review-result.helper.js';

describe('mapSerperReviewResult', () => {
  it('maps a review item to the reviews-search result shape', () => {
    expect(
      mapSerperReviewResult(
        {
          snippet: 'Great place',
          rating: 5,
          isoDate: '2025-01-01T00:00:00Z',
          likes: 3,
          user: { name: 'Alice' },
        },
        'Cafe',
      ),
    ).toEqual({
      author: 'Alice',
      snippet: 'Great place',
      rating: 5,
      date: '2025-01-01T00:00:00Z',
      likes: 3,
      place: 'Cafe',
    });
  });

  it('falls back to the date field and empty author', () => {
    expect(
      mapSerperReviewResult(
        {
          snippet: '',
          date: '2025-01-02',
          likes: null,
        },
        'Cafe',
      ),
    ).toEqual({
      author: '',
      snippet: '',
      rating: undefined,
      date: '2025-01-02',
      likes: 0,
      place: 'Cafe',
    });
  });
});
