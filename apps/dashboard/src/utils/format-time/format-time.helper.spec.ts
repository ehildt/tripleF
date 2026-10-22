import { describe, expect, it } from 'vitest';

import { formatTime } from './format-time.helper';

describe('formatTime', () => {
  it('formats a timestamp as a locale-aware time string', () => {
    const stamp = new Date(2024, 0, 1, 14, 3, 5).getTime();
    expect(formatTime(stamp, 'en-US')).toBe('02:03:05 PM');
  });

  it('uses the requested locale', () => {
    const stamp = new Date(2024, 0, 1, 14, 3, 5).getTime();
    // de-DE renders a 24-hour clock, so the leading hour matches 14.
    expect(formatTime(stamp, 'de-DE')).toContain('14:03:05');
  });
});
