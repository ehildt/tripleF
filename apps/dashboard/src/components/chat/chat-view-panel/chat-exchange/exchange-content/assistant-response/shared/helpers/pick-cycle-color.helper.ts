import { CYCLE_COLOR_TOKENS } from './cycle-color-tokens.constant';

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
