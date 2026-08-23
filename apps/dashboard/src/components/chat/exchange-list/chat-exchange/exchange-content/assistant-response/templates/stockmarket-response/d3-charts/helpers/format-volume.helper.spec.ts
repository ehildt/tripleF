import { describe, expect, it } from 'vitest';

import { formatVolume } from './format-volume.helper';

describe('formatVolume', () => {
  it('formats values in the millions with two decimals', () => {
    expect(formatVolume(1_240_000)).toBe('1.24M');
    expect(formatVolume(3_000_000)).toBe('3.00M');
  });

  it('formats thousands with one decimal', () => {
    expect(formatVolume(12_400)).toBe('12.4K');
    expect(formatVolume(1000)).toBe('1.0K');
  });

  it('leaves small counts as raw integers', () => {
    expect(formatVolume(999)).toBe('999');
    expect(formatVolume(0)).toBe('0');
  });
});
