import { describe, expect, it } from 'vitest';

import { purpleColor } from './purple-color.helper';

describe('purpleColor', () => {
  it('ramps purple intensity with the amount', () => {
    expect(purpleColor(0).a).toBeLessThan(purpleColor(100).a);
    expect(purpleColor(100).b).toBeGreaterThan(purpleColor(0).b);
  });
});
