import { scaleLinear } from 'd3-scale';
import { describe, expect, it } from 'vitest';

import { resolveVisibleTimeTicks } from './resolve-visible-time-ticks.helper';

describe('resolveVisibleTimeTicks', () => {
  const x = scaleLinear().domain([0, 4]).range([100, 300]);

  function timeOfIndex(index: number): string | undefined {
    const times = [
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
    ];
    return times[index];
  }

  it('snaps each tick to its nearest bar and keeps the label', () => {
    const { xTicks, tickLabels } = resolveVisibleTimeTicks(
      [{ time: '2026-01-03', text: 'Jan 3', isMajor: true }],
      timeOfIndex,
      5,
      x,
      100,
    );
    expect(xTicks).toEqual([2]);
    expect(tickLabels.get(2)).toEqual({ text: 'Jan 3', isMajor: true });
  });

  it('drops a tick whose label would clip at the plot left edge', () => {
    const { xTicks, tickLabels } = resolveVisibleTimeTicks(
      [{ time: '2026-01-01', text: 'Jan 1', isMajor: false }],
      timeOfIndex,
      5,
      x,
      100,
    );
    expect(xTicks).toEqual([]);
    expect(tickLabels.size).toBe(0);
  });

  it('returns empty ticks for an empty plan', () => {
    const { xTicks, tickLabels } = resolveVisibleTimeTicks(
      [],
      timeOfIndex,
      5,
      x,
      100,
    );
    expect(xTicks).toEqual([]);
    expect(tickLabels.size).toBe(0);
  });
});
