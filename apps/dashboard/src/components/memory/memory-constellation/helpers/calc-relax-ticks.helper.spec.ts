import { describe, expect, it } from 'vitest';

import { calcRelaxTicks } from './calc-relax-ticks.helper';

describe('calcRelaxTicks', () => {
  it('uses the full budget at and below the large-scene threshold', () => {
    expect(calcRelaxTicks(20)).toBe(200);
    expect(calcRelaxTicks(2000)).toBe(200);
  });

  it('uses the reduced budget above the large-scene threshold', () => {
    expect(calcRelaxTicks(2001)).toBe(60);
  });
});
