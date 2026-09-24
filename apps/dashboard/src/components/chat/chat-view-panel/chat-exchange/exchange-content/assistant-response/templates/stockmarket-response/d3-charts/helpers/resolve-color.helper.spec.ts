import { describe, expect, it } from 'vitest';

import { resolveColor } from './resolve-color.helper';

describe('resolveColor', () => {
  it('rebuilds an rgba() string from an rgb() token', () => {
    expect(resolveColor('rgb(255, 0, 0)', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('applies the requested alpha', () => {
    expect(resolveColor('rgb(10, 20, 30)', 1)).toBe('rgba(10, 20, 30, 1)');
  });

  it('falls back to neutral gray for unresolvable colors', () => {
    expect(resolveColor('var(--unknown-token)', 0.25)).toBe(
      'rgba(128, 128, 128, 0.25)',
    );
  });

  it('caches repeated lookups', () => {
    const first = resolveColor('rgb(1, 2, 3)', 0.9);
    const second = resolveColor('rgb(1, 2, 3)', 0.9);
    expect(second).toBe(first);
  });
});
