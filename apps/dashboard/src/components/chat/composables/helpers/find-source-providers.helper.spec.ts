import { describe, expect, it } from 'vitest';

import { findSourceProviders } from './find-source-providers.helper';

describe('findSourceProviders', () => {
  it('returns the providers offering the source in snapshot order', () => {
    const snapshot = {
      serper: { webSearch: { enabled: true } },
      youtube: { videos: { enabled: true } },
      brightData: { webSearch: { enabled: false } },
    };

    expect(findSourceProviders(snapshot, 'webSearch')).toEqual([
      'serper',
      'brightData',
    ]);
  });

  it('skips providers whose engine is not an object', () => {
    const snapshot = { serper: 'nope', brightData: { webSearch: {} } };

    expect(findSourceProviders(snapshot, 'webSearch')).toEqual(['brightData']);
  });

  it('returns an empty list for missing snapshots', () => {
    expect(findSourceProviders(null, 'webSearch')).toEqual([]);
    expect(findSourceProviders(undefined, 'webSearch')).toEqual([]);
  });
});
