import { describe, expect, it } from 'vitest';

import { dedupeMarkers } from './dedupe-markers.helper';

describe('dedupeMarkers', () => {
  it('keeps distinct markers', () => {
    const markers = [
      { time: '2026-01-08', position: 'belowBar', shape: 'circle', text: 'D' },
      {
        time: '2026-01-09',
        position: 'aboveBar',
        shape: 'arrowDown',
        text: 'Sell',
      },
    ];
    expect(dedupeMarkers(markers)).toEqual(markers);
  });

  it('drops an exact duplicate marker', () => {
    const markers = [
      { time: '2026-01-08', position: 'belowBar', shape: 'circle', text: 'D' },
      { time: '2026-01-08', position: 'belowBar', shape: 'circle', text: 'D' },
    ];
    expect(dedupeMarkers(markers)).toHaveLength(1);
  });

  it('keeps markers at the same time with different text', () => {
    const markers = [
      { time: '2026-01-08', position: 'belowBar', shape: 'circle', text: 'D' },
      {
        time: '2026-01-08',
        position: 'aboveBar',
        shape: 'arrowDown',
        text: 'Sell',
      },
    ];
    expect(dedupeMarkers(markers)).toHaveLength(2);
  });

  it('returns an empty array for no markers', () => {
    expect(dedupeMarkers([])).toEqual([]);
  });
});
