import { utcFormat } from 'd3-time-format';

import type { TickInterval } from './build-time-tick-plan.helper.types';
import { MINUTE_MS } from './time-units.constant';

/** The label formatter for an interval's calendar alignment. */
export function buildLabel(interval: TickInterval): (date: Date) => string {
  if (interval.align === 'month') return utcFormat('%b');
  if (interval.align === 'week') return utcFormat('%b %-d');
  if (interval.align === 'day') return utcFormat('%-d');
  if (interval.align === 'hour') {
    // Short 12-hour labels: "12pm", "3am" — no minutes, no space.
    return (date) => {
      const hour = date.getUTCHours() % 12 || 12;
      return `${hour}${date.getUTCHours() < 12 ? 'am' : 'pm'}`;
    };
  }
  // Minute ticks are labelled with the bucket size so they read as minutes,
  // not day numbers.
  const minutes = Math.max(1, Math.round(interval.stepMs / MINUTE_MS));
  return () => `${minutes}m`;
}
