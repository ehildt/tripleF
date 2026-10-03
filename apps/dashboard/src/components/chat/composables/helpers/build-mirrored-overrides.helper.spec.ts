import { describe, expect, it } from 'vitest';

import { buildMirroredOverrides } from './build-mirrored-overrides.helper';

describe('buildMirroredOverrides', () => {
  it('merges the endpoint into fresh snapshot and session copies', () => {
    const snapshot = { serper: { webSearch: { enabled: false, results: 5 } } };
    const session = { serper: { webSearch: { enabled: false } } };

    const result = buildMirroredOverrides(
      snapshot,
      session,
      'serper',
      'webSearch',
      { enabled: true },
    );

    expect(result.snapshot).toEqual({
      serper: { webSearch: { enabled: true, results: 5 } },
    });
    expect(result.session).toEqual({
      serper: { webSearch: { enabled: true } },
    });
  });

  it('leaves the input objects untouched', () => {
    const snapshot = { serper: { webSearch: { enabled: false } } };
    const session = { serper: { webSearch: { enabled: false } } };

    buildMirroredOverrides(snapshot, session, 'serper', 'webSearch', {
      enabled: true,
    });

    expect(snapshot).toEqual({ serper: { webSearch: { enabled: false } } });
    expect(session).toEqual({ serper: { webSearch: { enabled: false } } });
  });

  it('adds a provider and source that are not present yet', () => {
    const result = buildMirroredOverrides(null, null, 'serper', 'webSearch', {
      enabled: true,
    });

    expect(result.snapshot).toEqual({
      serper: { webSearch: { enabled: true } },
    });
    expect(result.session).toEqual({
      serper: { webSearch: { enabled: true } },
    });
  });
});
