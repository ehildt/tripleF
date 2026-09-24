import { describe, expect, it } from 'vitest';

import { resolveHistoryRange } from './resolve-history-range.helper';

describe('resolveHistoryRange', () => {
  it('returns the first and last time of the series', () => {
    expect(
      resolveHistoryRange([
        { time: '2026-01-02' },
        { time: '2026-01-03' },
        { time: '2026-01-15' },
      ]),
    ).toEqual({ from: '2026-01-02', to: '2026-01-15' });
  });

  it('returns a single-day range for a one-bar series', () => {
    expect(resolveHistoryRange([{ time: '2026-01-02' }])).toEqual({
      from: '2026-01-02',
      to: '2026-01-02',
    });
  });

  it('returns null for an empty series', () => {
    expect(resolveHistoryRange([])).toBeNull();
  });
});
