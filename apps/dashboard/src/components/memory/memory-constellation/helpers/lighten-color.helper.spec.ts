import { describe, expect, it } from 'vitest';

import { lightenColor } from './lighten-color.helper';

describe('lightenColor', () => {
  it('returns the color unchanged at ratio 0', () => {
    expect(lightenColor('#8b5cf6', 0)).toBe('rgb(139, 92, 246)');
  });

  it('returns white at ratio 1', () => {
    expect(lightenColor('#8b5cf6', 1)).toBe('rgb(255, 255, 255)');
  });

  it('lightens toward white for an intermediate ratio', () => {
    const lightened = lightenColor('#000000', 0.5);
    expect(lightened).toBe('rgb(128, 128, 128)');
  });

  it('returns the input unchanged for a non-hex color', () => {
    expect(lightenColor('not-a-color', 0.5)).toBe('not-a-color');
  });
});
