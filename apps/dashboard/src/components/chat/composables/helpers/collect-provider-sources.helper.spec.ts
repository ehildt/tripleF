import { describe, expect, it } from 'vitest';

import { collectProviderSources } from './collect-provider-sources.helper';

type Sources = { key: string; enabled: boolean }[];

describe('collectProviderSources', () => {
  it('collects toggleable sources and skips reserved keys', () => {
    const sources: Sources = [];

    collectProviderSources(
      'serper',
      {
        enabled: true,
        apiKey: 'secret',
        webSearch: { enabled: true },
        web: { enabled: true },
        images: { enabled: false },
      },
      null,
      sources,
    );

    expect(sources).toEqual([
      { key: 'web', enabled: true },
      { key: 'images', enabled: false },
    ]);
  });

  it('applies the session override over the snapshot', () => {
    const sources: Sources = [];

    collectProviderSources(
      'serper',
      { web: { enabled: true } },
      { serper: { web: { enabled: false } } },
      sources,
    );

    expect(sources).toEqual([{ key: 'web', enabled: false }]);
  });

  it('dedupes a shared source and lights it when any engine has it on', () => {
    const sources: Sources = [];

    collectProviderSources(
      'serper',
      { videos: { enabled: false } },
      null,
      sources,
    );
    collectProviderSources(
      'youtube',
      { videos: { enabled: true } },
      null,
      sources,
    );

    expect(sources).toEqual([{ key: 'videos', enabled: true }]);
  });

  it('does nothing for a non-object engine', () => {
    const sources: Sources = [];

    collectProviderSources('serper', 'nope', null, sources);

    expect(sources).toEqual([]);
  });
});
