import { describe, expect, it } from 'vitest';

import { mapKeyFinding } from './map-key-finding.helper';

describe('mapKeyFinding', () => {
  it('normalizes string, record, and fallback entries', () => {
    expect(mapKeyFinding('plain')).toEqual({ text: 'plain' });
    expect(mapKeyFinding({ text: 'record' })).toEqual({ text: 'record' });
    expect(mapKeyFinding(42)).toEqual({ text: '42' });
  });
});
