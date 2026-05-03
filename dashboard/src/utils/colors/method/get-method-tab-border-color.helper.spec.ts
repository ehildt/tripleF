import { describe, expect, it } from 'vitest';

import { getMethodTabBorderColor } from './get-method-tab-border-color.helper';

describe('getMethodTabBorderColor', () => {
  it.each([
    ['GET', 'border-tab-rest/50'],
    ['POST', 'border-tab-accent/50'],
    ['PUT', 'border-tab-debug/50'],
    ['DELETE', 'border-tab-rest/50'],
    ['PATCH', 'border-tab-accent/50'],
    ['UNKNOWN', 'border-tab-debug/50'],
  ])('maps %s to %s', (method, expected) => {
    expect(getMethodTabBorderColor(method)).toBe(expected);
  });
});
