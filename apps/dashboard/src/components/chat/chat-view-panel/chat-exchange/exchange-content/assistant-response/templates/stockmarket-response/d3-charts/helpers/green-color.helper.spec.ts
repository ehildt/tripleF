import { describe, expect, it } from 'vitest';

import { greenColor } from './green-color.helper';

describe('greenColor', () => {
  it('ramps green intensity with the amount', () => {
    expect(greenColor(0).a).toBeLessThan(greenColor(100).a);
    expect(greenColor(100).r).toBeGreaterThan(greenColor(0).r);
  });
});
