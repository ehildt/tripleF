import { z } from 'zod';

/**
 * Chart overlay schemas shared by the stockmarket item and list responses —
 * both templates render the same price-level lines and annotations on the
 * client chart.
 */

/** A dashed horizontal price line with a right-axis value badge. */
export const referenceLineSchema = z.object(
  {
    value: z.number(),
    label: z.string().optional(),
    /** A theme token name, e.g. "accent-primary" or "status-error". */
    color: z.string().optional(),
  },
  { message: 'referenceLines entries must be objects with a numeric value' },
);

/** A chart annotation (e.g. a dividend "D" or a buy/sell signal). */
export const markerSchema = z.object(
  {
    time: z.string().min(1, { message: 'markers entries must have a time' }),
    position: z.enum(['aboveBar', 'belowBar']),
    /** A theme token name, e.g. "harmony-3" or "status-error". */
    color: z.string().optional(),
    shape: z.enum(['circle', 'arrowUp', 'arrowDown', 'square']),
    text: z.string().optional(),
  },
  {
    message: 'markers entries must be objects with time, position, and shape',
  },
);
