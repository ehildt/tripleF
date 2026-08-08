import type { D3ReferenceLine } from '../D3Chart.types';

/** Labels that mark a reference line as a moving-average trend value. */
const MOVING_AVERAGE_LABEL =
  /\b(ma|sma|ema|wma|dma)\b|moving average|moving-average/i;

/**
 * A moving average is a trend line, not a horizontal price level — a
 * reference line at its current value duplicates the MA concept and clutters
 * the chart. Drop any reference line whose label names a moving average.
 * Ported from the lightweight-charts helper.
 */
export function isMovingAverageReferenceLine(line: D3ReferenceLine): boolean {
  return (
    typeof line.label === 'string' && MOVING_AVERAGE_LABEL.test(line.label)
  );
}
