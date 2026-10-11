import { describe, expect, it } from 'vitest';

import { pickVariantIcon } from './pick-variant-icon.helper';

describe('pickVariantIcon', () => {
  it('maps each variant to its glyph', () => {
    expect(pickVariantIcon('strength')).toBe('+');
    expect(pickVariantIcon('weakness')).toBe('−');
    expect(pickVariantIcon('recommendation')).toBe('→');
  });

  it('defaults to a bullet for a missing variant', () => {
    expect(pickVariantIcon(undefined)).toBe('•');
  });
});
