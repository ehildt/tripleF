/**
 * Theme-aware color tokens cycled across list items (sources dots, key
 * findings values). The first five keep the pre-existing order (accent +
 * harmony ramp); the four status colors extend the cycle so longer lists
 * stay varied instead of repeating the accent.
 */
export const CYCLE_COLOR_TOKENS = [
  '--color-accent-primary',
  '--color-harmony-1',
  '--color-harmony-2',
  '--color-harmony-3',
  '--color-harmony-4',
  '--color-status-info',
  '--color-status-success',
  '--color-status-warning',
  '--color-status-error',
] as const;

export type CycleColorToken = (typeof CYCLE_COLOR_TOKENS)[number];
