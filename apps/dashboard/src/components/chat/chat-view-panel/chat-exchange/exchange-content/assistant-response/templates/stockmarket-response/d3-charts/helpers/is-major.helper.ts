import type { TickAlign } from './build-time-tick-plan.helper.types';

/** Whether an alignment renders as a major (strong) grid line. */
export function isMajor(align: TickAlign): boolean {
  return align === 'month' || align === 'week' || align === 'hour';
}
