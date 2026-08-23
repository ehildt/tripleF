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

/**
 * CSS variable reference for the item at the given list index, cycling
 * through {@link CYCLE_COLOR_TOKENS} with modulo. Negative indices wrap
 * around the same way positive ones do.
 */
export function pickCycleColor(index: number): string {
  const length = CYCLE_COLOR_TOKENS.length;
  const token =
    CYCLE_COLOR_TOKENS[((index % length) + length) % length] ??
    CYCLE_COLOR_TOKENS[0];
  return `var(${token})`;
}
