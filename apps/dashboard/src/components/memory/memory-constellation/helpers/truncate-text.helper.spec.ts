import { describe, expect, it } from 'vitest';

import { truncateText } from './truncate-text.helper';

describe('truncateText', () => {
  it('returns the text unchanged when it fits', () => {
    expect(truncateText('short', 10)).toBe('short');
  });

  it('truncates with an ellipsis when it overflows', () => {
    expect(truncateText('abcdefghij', 5)).toBe('abcde…');
  });

  it('returns the text unchanged for a non-positive cap', () => {
    expect(truncateText('abcdefghij', 0)).toBe('abcdefghij');
  });
});
