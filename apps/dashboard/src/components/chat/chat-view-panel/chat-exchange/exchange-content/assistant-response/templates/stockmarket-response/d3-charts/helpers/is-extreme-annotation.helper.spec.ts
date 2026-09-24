import { describe, expect, it } from 'vitest';

import { isExtremeAnnotation } from './is-extreme-annotation.helper';

describe('isExtremeAnnotation', () => {
  it('matches all-time and 52-week extreme labels', () => {
    expect(isExtremeAnnotation('ATH @ 236.54')).toBe(true);
    expect(isExtremeAnnotation('ATL @ 95.00')).toBe(true);
    expect(isExtremeAnnotation('52W ATH @ 236.54')).toBe(true);
    expect(isExtremeAnnotation('52W ATL @ 95.00')).toBe(true);
    expect(isExtremeAnnotation('12y ATH @ 236.54')).toBe(true);
    expect(isExtremeAnnotation('All-Time High @ 236.54')).toBe(true);
    expect(isExtremeAnnotation('All Time Low @ 95.00')).toBe(true);
    expect(isExtremeAnnotation('52w High @ 95.00')).toBe(true);
    expect(isExtremeAnnotation('52W HIGH @ 236.54')).toBe(true);
    expect(isExtremeAnnotation('1Y LOW @ 95.00')).toBe(true);
    expect(isExtremeAnnotation('12y High @ 303.00')).toBe(true);
  });

  it('keeps non-extreme annotations', () => {
    expect(isExtremeAnnotation('D')).toBe(false);
    expect(isExtremeAnnotation('Buy @ 83')).toBe(false);
    expect(isExtremeAnnotation('Sell @ 113')).toBe(false);
    expect(isExtremeAnnotation('Dividend')).toBe(false);
  });

  it('handles empty and missing text', () => {
    expect(isExtremeAnnotation(undefined)).toBe(false);
    expect(isExtremeAnnotation(null)).toBe(false);
    expect(isExtremeAnnotation('')).toBe(false);
  });
});
