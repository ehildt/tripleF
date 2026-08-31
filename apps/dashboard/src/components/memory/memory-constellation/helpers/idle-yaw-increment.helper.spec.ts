import { describe, expect, it } from 'vitest';

import { idleYawIncrement } from './idle-yaw-increment.helper';

describe('idleYawIncrement', () => {
  it('returns 0 while the user is interacting or hovering', () => {
    expect(idleYawIncrement(true, false, 0, 0.016, 10_000)).toBe(0);
    expect(idleYawIncrement(false, true, 0, 0.016, 10_000)).toBe(0);
  });

  it('returns 0 inside the resume cooldown after an interaction', () => {
    expect(idleYawIncrement(false, false, 9000, 0.016, 10_000)).toBe(0);
  });

  it('orbits slowly once the cooldown has passed', () => {
    expect(idleYawIncrement(false, false, 0, 0.016, 10_000)).toBeCloseTo(
      0.1 * 0.016,
    );
  });
});
