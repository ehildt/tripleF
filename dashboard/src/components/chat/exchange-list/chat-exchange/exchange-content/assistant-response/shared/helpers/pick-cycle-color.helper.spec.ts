import { describe, expect, it } from 'vitest';

import { CYCLE_COLOR_TOKENS, pickCycleColor } from './pick-cycle-color.helper';

describe('pickCycleColor', () => {
  it('returns the var() reference for the token at the given index', () => {
    expect(pickCycleColor(0)).toBe('var(--color-accent-primary)');
    expect(pickCycleColor(3)).toBe('var(--color-harmony-3)');
    expect(pickCycleColor(8)).toBe('var(--color-status-error)');
  });

  it('cycles with modulo instead of going out of bounds', () => {
    expect(pickCycleColor(CYCLE_COLOR_TOKENS.length)).toBe(pickCycleColor(0));
    expect(pickCycleColor(CYCLE_COLOR_TOKENS.length + 1)).toBe(
      pickCycleColor(1),
    );
  });

  it('wraps negative indices the same way as positive ones', () => {
    expect(pickCycleColor(-1)).toBe(
      pickCycleColor(CYCLE_COLOR_TOKENS.length - 1),
    );
    expect(pickCycleColor(-CYCLE_COLOR_TOKENS.length)).toBe(pickCycleColor(0));
  });

  it('keeps the pre-existing first five colors in order', () => {
    expect(CYCLE_COLOR_TOKENS.slice(0, 5)).toEqual([
      '--color-accent-primary',
      '--color-harmony-1',
      '--color-harmony-2',
      '--color-harmony-3',
      '--color-harmony-4',
    ]);
  });

  it('extends the cycle with the four status colors', () => {
    expect(CYCLE_COLOR_TOKENS.slice(5)).toEqual([
      '--color-status-info',
      '--color-status-success',
      '--color-status-warning',
      '--color-status-error',
    ]);
  });
});
