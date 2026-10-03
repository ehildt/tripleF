import { describe, expect, it } from 'vitest';

import { resolveSourceTargets } from './resolve-source-targets.helper';

describe('resolveSourceTargets', () => {
  it('returns only the engines that currently have the source enabled', () => {
    const snapshot = {
      serper: { webSearch: { enabled: true } },
      brightData: { webSearch: { enabled: false } },
    };

    expect(resolveSourceTargets(snapshot, null, 'webSearch')).toEqual([
      'serper',
    ]);
  });

  it('falls back to serper when the source is off everywhere', () => {
    const snapshot = {
      serper: { webSearch: { enabled: false } },
      brightData: { webSearch: { enabled: false } },
    };

    expect(resolveSourceTargets(snapshot, null, 'webSearch')).toEqual([
      'serper',
    ]);
  });

  it('falls back to the first offering engine when serper is absent', () => {
    const snapshot = {
      brightData: { webSearch: { enabled: false } },
      youtube: { webSearch: { enabled: false } },
    };

    expect(resolveSourceTargets(snapshot, null, 'webSearch')).toEqual([
      'brightData',
    ]);
  });

  it('returns an empty list when no engine offers the source', () => {
    expect(resolveSourceTargets({ serper: {} }, null, 'webSearch')).toEqual([]);
  });
});
