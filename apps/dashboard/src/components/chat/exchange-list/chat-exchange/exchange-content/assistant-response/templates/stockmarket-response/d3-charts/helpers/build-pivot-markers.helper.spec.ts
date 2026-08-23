import { describe, expect, it } from 'vitest';

import {
  buildPivotMarkers,
  type PivotHistoryPoint,
} from './build-pivot-markers.helper';

const COLORS = { buy: '#00cc7f', sell: '#ff4466' };

function historyPoint(
  close: number,
  high = close,
  low = close,
): PivotHistoryPoint {
  return {
    time: `2026-01-${String(close).padStart(2, '0')}`,
    high,
    low,
  };
}

describe('buildPivotMarkers', () => {
  it('marks a local high as sell and a local low as buy', () => {
    const history = [
      historyPoint(10),
      historyPoint(20),
      historyPoint(30),
      historyPoint(50), // local high
      historyPoint(30),
      historyPoint(20),
      historyPoint(10),
      historyPoint(5), // local low
      historyPoint(10),
      historyPoint(20),
      historyPoint(30),
    ];
    const markers = buildPivotMarkers(history, COLORS);
    expect(markers.some((m) => m.shape === 'arrowDown')).toBe(true);
    expect(markers.some((m) => m.shape === 'arrowUp')).toBe(true);
  });

  it('colours buy markers green and sell markers red', () => {
    const history = [
      historyPoint(10),
      historyPoint(20),
      historyPoint(30),
      historyPoint(50), // local high
      historyPoint(30),
      historyPoint(20),
      historyPoint(10),
      historyPoint(5), // local low
      historyPoint(10),
      historyPoint(20),
      historyPoint(30),
    ];
    const markers = buildPivotMarkers(history, COLORS);
    const sell = markers.find((m) => m.shape === 'arrowDown');
    const buy = markers.find((m) => m.shape === 'arrowUp');
    expect(sell?.color).toBe(COLORS.sell);
    expect(buy?.color).toBe(COLORS.buy);
  });

  it('labels markers with the price first, then the marker word', () => {
    const history = [
      historyPoint(10),
      historyPoint(20),
      historyPoint(30),
      historyPoint(50), // local high
      historyPoint(30),
      historyPoint(20),
      historyPoint(10),
    ];
    const [marker] = buildPivotMarkers(history, COLORS);
    expect(marker.text).toBe('50.00 Sell');
  });

  it('produces deterministic markers for the same history', () => {
    const history = Array.from({ length: 60 }, (_, i) =>
      historyPoint(10 + (i % 40)),
    );
    expect(buildPivotMarkers(history, COLORS)).toEqual(
      buildPivotMarkers(history, COLORS),
    );
  });

  it('caps markers to the most recent MAX_MARKERS', () => {
    const history = Array.from({ length: 200 }, (_, i) =>
      historyPoint(10 + (i % 40)),
    );
    const markers = buildPivotMarkers(history, COLORS);
    expect(markers.length).toBeLessThanOrEqual(20);
  });

  it('returns no markers for a flat or too-short series', () => {
    expect(buildPivotMarkers([], COLORS)).toEqual([]);
    expect(
      buildPivotMarkers([historyPoint(1), historyPoint(2)], COLORS),
    ).toEqual([]);
  });
});
