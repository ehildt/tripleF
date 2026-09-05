import { describe, expect, it } from 'vitest';

import { normalizeSubject } from './normalize-subject.helper.js';

describe('normalizeSubject', () => {
  it('trims and lowercases the entity label', () => {
    expect(normalizeSubject('  Stellar Blade ')).toBe('stellar blade');
  });

  it('collapses whitespace runs', () => {
    expect(normalizeSubject('payments   service')).toBe('payments service');
  });

  it('returns undefined for empty or missing input', () => {
    expect(normalizeSubject(undefined)).toBeUndefined();
    expect(normalizeSubject(null)).toBeUndefined();
    expect(normalizeSubject('   ')).toBeUndefined();
  });

  it('rejects oversized subjects', () => {
    expect(normalizeSubject('a'.repeat(41))).toBeUndefined();
  });
});
