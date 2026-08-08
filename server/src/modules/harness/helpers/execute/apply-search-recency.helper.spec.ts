import { describe, expect, it } from 'vitest';

import { applySearchRecency } from './apply-search-recency.helper.js';

const NOW = new Date('2026-08-11T12:00:00Z');

describe('applySearchRecency', () => {
  it('anchors news search queries with the full current date', () => {
    const input = { query: 'latest AI regulation' };
    const result = applySearchRecency('serperNewsSearch', input, NOW) as {
      query: string;
    };
    expect(result.query).toContain('11 August 2026');
  });

  it('leaves an already-dated news query unchanged', () => {
    const input = { query: 'AI regulation 11 August 2026' };
    const result = applySearchRecency('serperNewsSearch', input, NOW) as {
      query: string;
    };
    expect(result.query).toBe('AI regulation 11 August 2026');
  });

  it('does NOT append a year to video search queries', () => {
    const input = { query: 'cold wave music videos playlist' };
    const result = applySearchRecency('serperVideoSearch', input, NOW) as {
      query: string;
    };
    expect(result.query).toBe('cold wave music videos playlist');
  });

  it('does NOT append a year to youtube video search queries', () => {
    const input = { query: 'dark wave vampire goth music' };
    const result = applySearchRecency('youtubeVideoSearch', input, NOW) as {
      query: string;
    };
    expect(result.query).toBe('dark wave vampire goth music');
  });

  it('does NOT append a year to web search queries', () => {
    const input = { query: 'compound interest explained' };
    const result = applySearchRecency('webSearch', input, NOW) as {
      query: string;
    };
    expect(result.query).toBe('compound interest explained');
  });

  it('does NOT append a year to image search queries', () => {
    const input = { query: 'gothic cathedral interior' };
    const result = applySearchRecency('serperImageSearch', input, NOW) as {
      query: string;
    };
    expect(result.query).toBe('gothic cathedral interior');
  });

  it('still excludes identity/transactional lookups', () => {
    const shopping = applySearchRecency(
      'serperShoppingSearch',
      { query: 'Sony WH-1000XM5' },
      NOW,
    ) as { query: string };
    expect(shopping.query).toBe('Sony WH-1000XM5');

    const places = applySearchRecency(
      'serperPlacesSearch',
      { query: 'cafe in Berlin' },
      NOW,
    ) as { query: string };
    expect(places.query).toBe('cafe in Berlin');
  });

  it('returns non-object or empty input untouched', () => {
    expect(
      applySearchRecency('serperNewsSearch', undefined, NOW),
    ).toBeUndefined();
    expect(
      applySearchRecency('serperNewsSearch', { query: '  ' }, NOW),
    ).toEqual({ query: '  ' });
  });
});
