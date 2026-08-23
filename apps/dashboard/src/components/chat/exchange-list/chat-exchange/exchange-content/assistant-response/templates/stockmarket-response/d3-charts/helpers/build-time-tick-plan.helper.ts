import { utcFormat } from 'd3-time-format';

/** One time-axis tick. */
export interface TimeTick {
  /** ISO time string of the tick. */
  time: string;
  /** Label text. */
  text: string;
  /** Whether this tick is a major line (strong grid style). */
  isMajor: boolean;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

type TickAlign = 'month' | 'week' | 'day' | 'hour' | 'minute';

interface TickInterval {
  stepMs: number;
  align: TickAlign;
}

/** Pick the tick interval so roughly one tick lands every 50px of width. */
function pickInterval(
  spanMs: number,
  plotWidth: number,
  hasTimeComponent: boolean,
): TickInterval {
  const targetTicks = Math.max(2, Math.floor(plotWidth / 50));
  const spanPerTick = spanMs / targetTicks;
  if (spanPerTick > 45 * DAY_MS)
    return { stepMs: 3 * MONTH_MS, align: 'month' };
  if (spanPerTick > 20 * DAY_MS) return { stepMs: MONTH_MS, align: 'month' };
  if (spanPerTick > 10 * DAY_MS) return { stepMs: 2 * WEEK_MS, align: 'week' };
  if (spanPerTick > 4 * DAY_MS) return { stepMs: WEEK_MS, align: 'week' };
  if (spanPerTick > 2 * DAY_MS) return { stepMs: 2 * DAY_MS, align: 'day' };
  if (spanPerTick > DAY_MS) return { stepMs: DAY_MS, align: 'day' };
  // Daily data has no intraday times — never fall through to hour/minute
  // ticks, however far the user zooms in.
  if (!hasTimeComponent) return { stepMs: DAY_MS, align: 'day' };
  if (spanPerTick > 12 * HOUR_MS)
    return { stepMs: 12 * HOUR_MS, align: 'hour' };
  if (spanPerTick > 6 * HOUR_MS) return { stepMs: 6 * HOUR_MS, align: 'hour' };
  if (spanPerTick > 3 * HOUR_MS) return { stepMs: 3 * HOUR_MS, align: 'hour' };
  if (spanPerTick > HOUR_MS) return { stepMs: HOUR_MS, align: 'hour' };
  if (spanPerTick > 30 * MINUTE_MS)
    return { stepMs: 30 * MINUTE_MS, align: 'minute' };
  if (spanPerTick > 15 * MINUTE_MS)
    return { stepMs: 15 * MINUTE_MS, align: 'minute' };
  if (spanPerTick > 5 * MINUTE_MS)
    return { stepMs: 5 * MINUTE_MS, align: 'minute' };
  return { stepMs: MINUTE_MS, align: 'minute' };
}

/** Align a date to the start of its calendar bucket. */
function alignToBucket(date: Date, interval: TickInterval): Date {
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

/** Advance a tick by one interval step. */
function addStep(date: Date, interval: TickInterval): Date {
  const d = new Date(date);
  if (interval.align === 'month') {
    d.setUTCMonth(d.getUTCMonth() + Math.round(interval.stepMs / MONTH_MS));
  } else {
    d.setTime(d.getTime() + interval.stepMs);
  }
  return d;
}

function buildLabel(interval: TickInterval): (date: Date) => string {
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

function isMajor(align: TickAlign): boolean {
  return align === 'month' || align === 'week' || align === 'hour';
}

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
