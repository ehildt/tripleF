import { describe, expect, it } from 'vitest';

import type { MarkerLayout } from './build-marker-layout.helper';
import { forceExtremeMarkers } from './force-extreme-markers.helper';

// 10 ascending daily bars in April 2026; the range high is the last bar, the
// range low the first bar.
const points = Array.from({ length: 10 }, (_, i) => ({
  time: new Date(Date.UTC(2026, 3, 1 + i)).toISOString().slice(0, 10),
  high: 100 + i * 10, // range high: 190 at index 9
  low: 95 + i * 10, // range low: 95 at index 0
}));

const colors = { high: 'purple', low: 'purple' };

function pivot(index: number, textAbove: boolean): MarkerLayout {
  return {
    index,
    price: 1000,
    symbol: textAbove ? 'arrowDown' : 'arrowUp',
    color: 'red',
    text: '190 Sell',
    textAbove,
  };
}

describe('forceExtremeMarkers', () => {
  it('turns the range-high anchor into a purple bullet labeled with the price', () => {
    const result = forceExtremeMarkers(
      [pivot(3, true), pivot(9, true)],
      points,
      { from: 0, to: 10 },
      '1Y',
      colors,
      (p) => `$${p}`,
    );

    expect(result.find((l) => l.index === 3)?.symbol).toBe('arrowDown');

    const ath = result.find((l) => l.index === 9);
    expect(ath?.symbol).toBe('circle');
    expect(ath?.color).toBe('purple');
    expect(ath?.text).toBe('1Y HIGH @ $190');
    expect(ath?.textAbove).toBe(true);
  });

  it('turns the range-low anchor into a purple bullet below the bar', () => {
    const result = forceExtremeMarkers(
      [pivot(0, false)],
      points,
      { from: 0, to: 10 },
      'All',
      colors,
      (p) => `${p}`,
    );

    const atl = result.find((l) => l.index === 0);
    expect(atl?.symbol).toBe('circle');
    expect(atl?.color).toBe('purple');
    expect(atl?.text).toBe('All LOW @ 95');
    expect(atl?.textAbove).toBe(false);
  });

  it('appends bullets when no marker anchors at the extremes', () => {
    const result = forceExtremeMarkers(
      [],
      points,
      { from: 0, to: 10 },
      '1Y',
      colors,
      (p) => `${p}`,
    );

    expect(result).toHaveLength(2);
    expect(result[0].textAbove).toBe(true);
    expect(result[1].textAbove).toBe(false);
  });

  it('drops duplicates on an extreme bar, keeping a single bullet', () => {
    const result = forceExtremeMarkers(
      [pivot(9, true), pivot(9, false)],
      points,
      { from: 0, to: 10 },
      '1Y',
      colors,
      (p) => `${p}`,
    );
    expect(result.filter((l) => l.index === 9)).toHaveLength(1);
  });

  it('computes the extremes over the given range slice', () => {
    // A window over bars 4..8: high at index 8, low at index 4.
    const result = forceExtremeMarkers(
      [],
      points,
      { from: 4, to: 9 },
      '3M',
      colors,
      (p) => `${p}`,
    );
    expect(result.find((l) => l.index === 8)?.text).toBe('3M HIGH @ 180');
    expect(result.find((l) => l.index === 4)?.text).toBe('3M LOW @ 135');
  });

  it('returns the layouts untouched without data', () => {
    const input = [pivot(1, true)];
    expect(
      forceExtremeMarkers(
        input,
        [],
        { from: 0, to: 0 },
        '1Y',
        colors,
        (p) => `${p}`,
      ),
    ).toBe(input);
  });
});
