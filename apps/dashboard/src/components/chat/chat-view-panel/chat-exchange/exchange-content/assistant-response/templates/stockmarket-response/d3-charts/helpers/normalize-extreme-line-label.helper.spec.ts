import { describe, expect, it } from 'vitest';

import { normalizeExtremeLineLabel } from './normalize-extreme-line-label.helper';

describe('normalizeExtremeLineLabel', () => {
  it('normalizes 52-week labels to the canonical 52W HIGH/LOW format', () => {
    expect(normalizeExtremeLineLabel('52w high')).toBe('52W HIGH');
    expect(normalizeExtremeLineLabel('52W High')).toBe('52W HIGH');
    expect(normalizeExtremeLineLabel('52w low')).toBe('52W LOW');
    expect(normalizeExtremeLineLabel('52w ATH')).toBe('52W HIGH');
    expect(normalizeExtremeLineLabel('52W ATL')).toBe('52W LOW');
  });

  it('normalizes all-time labels to the All HIGH/LOW format', () => {
    expect(normalizeExtremeLineLabel('ATH')).toBe('All HIGH');
    expect(normalizeExtremeLineLabel('ATL')).toBe('All LOW');
    expect(normalizeExtremeLineLabel('All-Time High')).toBe('All HIGH');
    expect(normalizeExtremeLineLabel('all time low')).toBe('All LOW');
  });

  it('keeps non-extreme labels unchanged', () => {
    expect(normalizeExtremeLineLabel('Support')).toBe('Support');
    expect(normalizeExtremeLineLabel('Resistance')).toBe('Resistance');
    expect(normalizeExtremeLineLabel(undefined)).toBeUndefined();
  });
});
