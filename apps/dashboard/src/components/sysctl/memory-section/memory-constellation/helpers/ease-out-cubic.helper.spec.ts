import { describe, expect, it } from 'vitest';

import { easeOutCubic } from './ease-out-cubic.helper';

describe('easeOutCubic', () => {
  it('starts fast and settles at 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(0.25)).toBeGreaterThan(0.5);
    expect(easeOutCubic(1)).toBe(1);
  });
});
