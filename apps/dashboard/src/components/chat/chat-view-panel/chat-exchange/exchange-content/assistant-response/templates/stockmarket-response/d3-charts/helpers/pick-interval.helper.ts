import type { TickInterval } from './build-time-tick-plan.helper.types';
import {
  DAY_MS,
  HOUR_MS,
  MINUTE_MS,
  MONTH_MS,
  WEEK_MS,
} from './time-units.constant';

/** Pick the tick interval so roughly one tick lands every 50px of width. */
export function pickInterval(
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
