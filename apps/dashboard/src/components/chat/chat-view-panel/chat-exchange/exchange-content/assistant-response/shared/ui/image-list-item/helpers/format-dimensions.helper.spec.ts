import { describe, expect, it } from 'vitest';

import { formatDimensions } from './format-dimensions.helper';

describe('formatDimensions', () => {
  it('joins width and height with a multiplication sign', () => {
    expect(formatDimensions(2560, 1440)).toBe('2560×1440');
  });

  it('returns an empty string when either dimension is missing', () => {
    expect(formatDimensions(undefined, 1440)).toBe('');
    expect(formatDimensions(2560)).toBe('');
    expect(formatDimensions()).toBe('');
  });

  it('treats zero as missing', () => {
    expect(formatDimensions(0, 1440)).toBe('');
  });
});
