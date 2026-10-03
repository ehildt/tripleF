import type { TickInterval } from './build-time-tick-plan.helper.types';
import { MONTH_MS } from './time-units.constant';

/** Advance a tick by one interval step. */
export function addStep(date: Date, interval: TickInterval): Date {
  const d = new Date(date);
  if (interval.align === 'month') {
    d.setUTCMonth(d.getUTCMonth() + Math.round(interval.stepMs / MONTH_MS));
  } else {
    d.setTime(d.getTime() + interval.stepMs);
  }
  return d;
}
