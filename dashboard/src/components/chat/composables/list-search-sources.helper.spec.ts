import { describe, expect, it } from 'vitest';

import { listSearchSources } from './list-search-sources.helper';

const snapshot = {
  serper: {
    enabled: true,
    apiKey: 'abcd****wxyz',
    web: { enabled: true, results: 3 },
    images: { enabled: false, results: 6 },
    news: { enabled: true, results: 3 },
    webpageFetch: { enabled: true },
  },
  sources: {
    preferred: [],
    blocked: [],
  },
};

describe('listSearchSources', () => {
  it('lists every toggleable source with its enabled state', () => {
    expect(listSearchSources(snapshot, null)).toEqual([
      { key: 'web', enabled: true },
      { key: 'images', enabled: false },
      { key: 'news', enabled: true },
      { key: 'webpageFetch', enabled: true },
    ]);
  });

  it('lets a session override win over the snapshot', () => {
    const sessionOverrides = {
      serper: {
        images: { enabled: true },
        news: { enabled: false },
      },
    };
    expect(listSearchSources(snapshot, sessionOverrides)).toEqual([
      { key: 'web', enabled: true },
      { key: 'images', enabled: true },
      { key: 'news', enabled: false },
      { key: 'webpageFetch', enabled: true },
    ]);
  });

  it('deduplicates sources shared by future engines', () => {
    const twoEngines = {
      ...snapshot,
      tavily: {
        enabled: true,
        apiKey: 'x',
        news: { enabled: false },
        videos: { enabled: true },
      },
    };
    expect(listSearchSources(twoEngines, null)).toEqual([
      { key: 'web', enabled: true },
      { key: 'images', enabled: false },
      { key: 'news', enabled: true },
      { key: 'webpageFetch', enabled: true },
      { key: 'videos', enabled: true },
    ]);
  });

  it('ignores reserved keys and non-search providers', () => {
    expect(
      listSearchSources(
        {
          serper: {
            enabled: true,
            apiKey: 'x',
            webSearch: { enabled: true },
            web: { enabled: true },
          },
          sources: { blocked: [] },
        },
        null,
      ).map((entry) => entry.key),
    ).toEqual(['web']);
  });

  it('returns an empty list without data', () => {
    expect(listSearchSources(null, null)).toEqual([]);
    expect(listSearchSources(undefined, undefined)).toEqual([]);
  });
});
