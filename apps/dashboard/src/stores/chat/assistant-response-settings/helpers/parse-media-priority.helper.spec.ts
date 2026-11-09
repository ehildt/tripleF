import { describe, expect, it } from 'vitest';

import { parseMediaPriority } from './parse-media-priority.helper';

describe('parseMediaPriority', () => {
  it('preserves videos and defaults other values to images', () => {
    expect(parseMediaPriority('videos')).toBe('videos');
    expect(parseMediaPriority('images')).toBe('images');
    expect(parseMediaPriority(null)).toBe('images');
    expect(parseMediaPriority('invalid')).toBe('images');
  });
});
