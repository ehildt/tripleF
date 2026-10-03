import type { TickInterval } from './build-time-tick-plan.helper.types';
import { MINUTE_MS } from './time-units.constant';

/** Align a date to the start of its calendar bucket. */
export function alignToBucket(date: Date, interval: TickInterval): Date {
  const d = new Date(date);
  const { stepMs, align } = interval;
  if (align === 'month') {
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
  } else if (align === 'week') {
    const sinceMonday = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - sinceMonday);
    d.setUTCHours(0, 0, 0, 0);
  } else if (align === 'day') {
    d.setUTCHours(0, 0, 0, 0);
  } else if (align === 'hour') {
    d.setUTCMinutes(0, 0, 0);
  } else {
    const stepMinutes = Math.max(1, Math.round(stepMs / MINUTE_MS));
    d.setUTCSeconds(0, 0);
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / stepMinutes) * stepMinutes);
  }
  return d;
}
