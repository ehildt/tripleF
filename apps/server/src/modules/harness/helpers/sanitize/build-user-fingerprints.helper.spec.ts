import { describe, expect, it } from 'vitest';

import { buildUserFingerprints } from './build-user-fingerprints.helper.js';

describe('buildUserFingerprints', () => {
  it('collects fingerprints of original (non-variant) entries', () => {
    const meta = [
      { variant: 'original', fingerprint: 'fp-1' },
      { variant: 'thumb', fingerprint: 'fp-2' },
      { fingerprint: 'fp-3' },
      { variant: 'original' },
    ];
    expect(buildUserFingerprints(meta)).toEqual(['fp-1', 'fp-3']);
  });

  it('returns an empty array for no entries', () => {
    expect(buildUserFingerprints([])).toEqual([]);
  });
});
