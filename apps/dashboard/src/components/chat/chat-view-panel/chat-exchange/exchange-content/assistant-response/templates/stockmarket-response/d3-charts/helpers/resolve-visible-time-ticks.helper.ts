import type { ScaleLinear } from 'd3-scale';

import type { TimeTickLabel } from './build-time-tick-formatter.helper';
import type { TimeTick } from './build-time-tick-plan.helper.types';
import { findNearestTimeIndex } from './find-nearest-time-index.helper';

/** The resolved x-axis ticks and their labels, keyed by bar index. */
type ResolvedTimeTicks = {
  /** Bar indices to draw time ticks at. */
  xTicks: number[];
  /** Label text and weight per tick index. */
  tickLabels: Map<number, TimeTickLabel>;
};

/**
 * Resolve a time-tick plan to concrete bar indices: each tick snaps to the
 * bar nearest its time, and ticks whose labels would clip at the plot's left
 * edge are dropped.
 */
export function resolveVisibleTimeTicks(
  plan: TimeTick[],
  timeOfIndex: (index: number) => string | undefined,
  dataLength: number,
  x: ScaleLinear<number, number>,
  plotLeft: number,
): ResolvedTimeTicks {
  const tickLabels = new Map<number, TimeTickLabel>();
  const xTicks: number[] = [];
  for (const tick of plan) {
    const index = findNearestTimeIndex(timeOfIndex, dataLength, tick.time);
    if (index === undefined) continue;
    const labelWidth = tick.text.length * 6.5;
    if (x(index) - labelWidth / 2 < plotLeft) continue;
    xTicks.push(index);
    tickLabels.set(index, { text: tick.text, isMajor: tick.isMajor });
  }
  return { xTicks, tickLabels };
}
