import { describe, expect, it } from 'vitest';

import { normalizeThink } from './normalize-think.helper.js';

describe('normalizeThink', () => {
  it('returns undefined for undefined input', () => {
    expect(normalizeThink(undefined)).toBeUndefined();
  });

  it('passes booleans through unchanged', () => {
    expect(normalizeThink(true)).toBe(true);
    expect(normalizeThink(false)).toBe(false);
  });

  it('maps "off" to false', () => {
    expect(normalizeThink('off')).toBe(false);
  });

  it('passes string levels through unchanged', () => {
    expect(normalizeThink('low')).toBe('low');
    expect(normalizeThink('medium')).toBe('medium');
    expect(normalizeThink('high')).toBe('high');
  });

  it('returns undefined for unrecognised string values', () => {
    expect(normalizeThink('unknown')).toBeUndefined();
  });
});
