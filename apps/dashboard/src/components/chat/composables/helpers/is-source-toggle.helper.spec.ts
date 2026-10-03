import { describe, expect, it } from 'vitest';

import { isSourceToggle } from './is-source-toggle.helper';

describe('isSourceToggle', () => {
  it('accepts an object with a boolean enabled flag', () => {
    expect(isSourceToggle({ enabled: true })).toBe(true);
    expect(isSourceToggle({ enabled: false })).toBe(true);
  });

  it('rejects values without a boolean enabled flag', () => {
    expect(isSourceToggle({ enabled: 'yes' })).toBe(false);
    expect(isSourceToggle({})).toBe(false);
    expect(isSourceToggle('x')).toBe(false);
    expect(isSourceToggle(null)).toBe(false);
    expect(isSourceToggle(undefined)).toBe(false);
  });
});
