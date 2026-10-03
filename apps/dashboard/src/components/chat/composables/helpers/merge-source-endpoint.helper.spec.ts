import { describe, expect, it } from 'vitest';

import { mergeSourceEndpoint } from './merge-source-endpoint.helper';

describe('mergeSourceEndpoint', () => {
  it('merges session overrides over the snapshot', () => {
    const snapshot = { serper: { webSearch: { enabled: true, results: 5 } } };
    const session = { serper: { webSearch: { enabled: false } } };

    expect(
      mergeSourceEndpoint(snapshot, session, 'serper', 'webSearch'),
    ).toEqual({ enabled: false, results: 5 });
  });

  it('returns the snapshot endpoint when no session override exists', () => {
    const snapshot = { serper: { webSearch: { enabled: true } } };

    expect(mergeSourceEndpoint(snapshot, null, 'serper', 'webSearch')).toEqual({
      enabled: true,
    });
  });

  it('returns an empty object when neither side has the endpoint', () => {
    expect(mergeSourceEndpoint({}, {}, 'serper', 'webSearch')).toEqual({});
  });
});
