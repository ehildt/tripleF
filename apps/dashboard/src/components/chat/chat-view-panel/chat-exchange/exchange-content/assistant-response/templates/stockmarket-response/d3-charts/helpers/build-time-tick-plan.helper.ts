import { addStep } from './add-step.helper';
import { alignToBucket } from './align-to-bucket.helper';
import { buildLabel } from './build-label.helper';
import type { TimeTick } from './build-time-tick-plan.helper.types';
import { isMajor } from './is-major.helper';
import { pickInterval } from './pick-interval.helper';

/**
 * Build the time-axis ticks for the visible range. The interval adapts to the
 * zoom level — months, weeks, days, then hours and 30/15/5-minute buckets —
 * so the vertical grid lines and labels stay readable at every zoom depth.
 * Ticks are aligned to calendar boundaries (month start, Monday, midnight,
 * the hour, or the minute bucket) and labelled accordingly.
 */
export function buildTimeTickPlan(
  firstTime: string,
  lastTime: string,
  plotWidth: number,
  hasTimeComponent: boolean,
): TimeTick[] {
  const first = new Date(firstTime);
  const last = new Date(lastTime);
  const spanMs = Math.max(1, last.getTime() - first.getTime());
  const interval = pickInterval(spanMs, plotWidth, hasTimeComponent);
  const label = buildLabel(interval);
  const major = isMajor(interval.align);
  const ticks: TimeTick[] = [];
  let tick = alignToBucket(first, interval);
  let dayLabelIndex = 0;
  while (tick.getTime() <= last.getTime()) {
    if (tick.getTime() >= first.getTime()) {
      // Day ticks label every other line so the axis stays clean; the grid
      // lines still render on every tick.
      const text =
        interval.align === 'day' && dayLabelIndex % 2 === 1 ? '' : label(tick);
      ticks.push({ time: tick.toISOString(), text, isMajor: major });
      dayLabelIndex++;
    }
    tick = addStep(tick, interval);
  }
  return ticks;
}
