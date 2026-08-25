import { describe, expect, it } from 'vitest';

import { isPointOnScreen } from './is-point-on-screen.helper';

describe('isPointOnScreen', () => {
  it('accepts points inside the viewport', () => {
    expect(isPointOnScreen(50, 50, 100, 100)).toBe(true);
  });

  it('accepts points within the margin just outside the viewport', () => {
    expect(isPointOnScreen(-20, 50, 100, 100)).toBe(true);
    expect(isPointOnScreen(120, 50, 100, 100)).toBe(true);
  });

  it('rejects points far outside the viewport', () => {
    expect(isPointOnScreen(-100, 50, 100, 100)).toBe(false);
    expect(isPointOnScreen(50, 500, 100, 100)).toBe(false);
  });
});
