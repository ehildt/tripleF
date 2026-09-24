import type { StackedAreaDay } from './build-stacked-area-data.helper';

/**
 * Cumulative stack top per series at a day (the bottom of series 0 is 0).
 * Negative values clamp to zero so the stack never collapses.
 */
export function computeCumulativeTops(day: StackedAreaDay): number[] {
  const tops: number[] = [];
  let sum = 0;
  for (const value of day.values) {
    sum += Math.max(0, value);
    tops.push(sum);
  }
  return tops;
}
