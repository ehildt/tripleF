import { describe, expect, it } from 'vitest';

import { mapEodhdNewsToResult } from './map-eodhd-news-to-result.helper.js';

describe('mapEodhdNewsToResult', () => {
  it('normalizes a news article into the tool result shape', () => {
    const result = mapEodhdNewsToResult(
      {
        title: 'Headline',
        link: 'https://example.com/story',
        date: '2025-01-01',
        content: 'A long body',
      },
      5,
    );
    expect(result.title).toBe('Headline');
    expect(result.url).toBe('https://example.com/story');
    expect(result.source).toBe('example.com');
    expect(result.date).toBe('2025-01-01');
    expect(result.snippet).toContain('A lon');
    expect(result.snippet).toContain('TRUNCATED');
  });

  it('leaves the snippet undefined when there is no content', () => {
    expect(
      mapEodhdNewsToResult(
        { title: 'Headline', link: 'https://example.com/story' },
        5,
      ).snippet,
    ).toBeUndefined();
  });
});
