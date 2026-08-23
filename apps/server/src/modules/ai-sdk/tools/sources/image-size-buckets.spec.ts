import { describe, expect, it } from 'vitest';

import { tbsSizeLabelForPixels } from './image-size-buckets.js';

describe('tbsSizeLabelForPixels', () => {
  it('picks the largest bucket at or below the target', () => {
    // 1280×720 ≈ 0.92 MP → xga (>1024×768).
    expect(tbsSizeLabelForPixels(1280 * 720)).toBe('xga');
    // 1920×1080 ≈ 2.07 MP → 2mp.
    expect(tbsSizeLabelForPixels(1920 * 1080)).toBe('2mp');
  });

  it('falls back to the largest bucket for huge targets', () => {
    expect(tbsSizeLabelForPixels(100_000_000)).toBe('70mp');
  });

  it('picks the smallest bucket for an in-range small target', () => {
    // 400×300 = 0.12 MP → qsvga.
    expect(tbsSizeLabelForPixels(400 * 300)).toBe('qsvga');
  });

  it('falls back to the largest bucket for sub-bucket targets', () => {
    expect(tbsSizeLabelForPixels(100)).toBe('70mp');
  });
});
