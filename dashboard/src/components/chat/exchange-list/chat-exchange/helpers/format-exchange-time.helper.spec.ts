import { describe, expect, it, vi } from 'vitest';

import { formatExchangeTime } from './format-exchange-time.helper';

describe('formatExchangeTime', () => {
  it('formats a timestamp using toLocaleTimeString', () => {
    const spy = vi
      .spyOn(Date.prototype, 'toLocaleTimeString')
      .mockReturnValue('12:34:56');
    const result = formatExchangeTime(0);
    expect(spy).toHaveBeenCalled();
    expect(result).toBe('12:34:56');
    spy.mockRestore();
  });

  it('returns a non-empty string for any timestamp', () => {
    expect(formatExchangeTime(1700000000000)).toMatch(/\d/);
  });
});
