import { describe, expect, it } from 'vitest';

import { resolveChangeClass } from './resolve-change-class.helper';

describe('resolveChangeClass', () => {
  it('maps a positive change to positive', () => {
    expect(resolveChangeClass(2.3)).toBe('positive');
  });

  it('maps a negative change to negative', () => {
    expect(resolveChangeClass(-1.1)).toBe('negative');
  });

  it('maps zero or undefined to neutral', () => {
    expect(resolveChangeClass(0)).toBe('neutral');
    expect(resolveChangeClass(undefined)).toBe('neutral');
  });
});
