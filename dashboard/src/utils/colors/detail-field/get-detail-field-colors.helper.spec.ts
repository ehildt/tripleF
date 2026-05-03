import { describe, expect, it } from 'vitest';

import { getDetailFieldColors } from './get-detail-field-colors.helper';

describe('getDetailFieldColors', () => {
  it('returns accent colors', () => {
    const colors = getDetailFieldColors();
    expect(colors.border).toContain('border-accent-primary');
    expect(colors.text).toContain('text-accent-primary');
    expect(colors.gradient).toContain('from-accent-primary');
  });
});
