import { describe, expect, it } from 'vitest';

import { configuredEngines } from './configured-engines.helper';

describe('configuredEngines', () => {
  it('returns an empty list without a snapshot', () => {
    expect(configuredEngines(undefined)).toEqual([]);
  });

  it('returns only engines with an apiKey', () => {
    const snapshot = {
      serper: { apiKey: 'masked' },
      brightData: { enabled: true },
      youtube: { apiKey: 'masked' },
      eodhd: { apiKey: '' },
    };
    expect(configuredEngines(snapshot)).toEqual(['serper', 'youtube']);
  });
});
