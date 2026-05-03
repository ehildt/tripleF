import { describe, expect, it } from 'vitest';

import { getMethodTabColor } from './get-method-tab-color.helper';

describe('getMethodTabColor', () => {
  it.each([
    ['GET', 'text-tab-rest'],
    ['POST', 'text-tab-accent'],
    ['PUT', 'text-tab-debug'],
    ['DELETE', 'text-tab-rest'],
    ['PATCH', 'text-tab-accent'],
    ['UNKNOWN', 'text-tab-debug'],
  ])('maps %s to %s', (method, expected) => {
    expect(getMethodTabColor(method)).toBe(expected);
  });
});
