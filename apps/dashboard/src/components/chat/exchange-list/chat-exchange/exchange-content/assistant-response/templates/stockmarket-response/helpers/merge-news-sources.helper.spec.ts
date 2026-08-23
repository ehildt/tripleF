import { describe, expect, it } from 'vitest';

import { mergeNewsSources } from './merge-news-sources.helper';

describe('mergeNewsSources', () => {
  it('returns an empty list when both inputs are missing', () => {
    expect(mergeNewsSources(undefined, undefined)).toEqual([]);
    expect(mergeNewsSources([], [])).toEqual([]);
  });

  it('keeps news entries when a URL appears in both lists', () => {
    const merged = mergeNewsSources(
      [
        {
          title: 'NVIDIA hits record high',
          url: 'https://example.com/nvda',
          source: 'Reuters',
        },
      ],
      [
        {
          title: 'NVIDIA hits record high',
          url: 'https://example.com/nvda',
          sourceName: 'Example Wire',
        },
      ],
    );
    expect(merged).toEqual([
      {
        title: 'NVIDIA hits record high',
        url: 'https://example.com/nvda',
        sourceName: 'Reuters',
      },
    ]);
  });

  it('adds sources that are not covered by news', () => {
    const merged = mergeNewsSources(
      [
        {
          title: 'NVIDIA hits record high',
          url: 'https://example.com/nvda',
          source: 'Reuters',
        },
      ],
      [
        {
          title: 'NVIDIA investor relations',
          url: 'https://investor.nvidia.com',
          sourceName: 'NVIDIA',
        },
      ],
    );
    expect(merged).toHaveLength(2);
    expect(merged[1]).toEqual({
      title: 'NVIDIA investor relations',
      url: 'https://investor.nvidia.com',
      sourceName: 'NVIDIA',
    });
  });

  it('dedupes by normalized URL and drops empty entries', () => {
    const merged = mergeNewsSources(
      [{ title: 'A', url: 'https://Example.com/x/' }, { title: 'B' }],
      [{ url: 'https://example.com/x' }],
    );
    expect(merged).toHaveLength(2);
  });
});
