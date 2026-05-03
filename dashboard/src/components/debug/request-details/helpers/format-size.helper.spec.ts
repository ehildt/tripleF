import { describe, expect, it } from 'vitest';

import { formatSize } from './format-size.helper';

describe('formatSize', () => {
  it('returns bytes for small content', () => {
    expect(formatSize('hello')).toMatch(/ B$/);
    expect(formatSize('hello').length).toBeGreaterThan(0);
  });

  it('returns kilobytes for large content', () => {
    const big = 'a'.repeat(2048);
    expect(formatSize(big)).toMatch(/ KB$/);
  });

  it('handles objects via JSON', () => {
    const obj = { a: 1, b: 'x' };
    expect(formatSize(obj)).toMatch(/ B$/);
  });

  it('handles null and undefined', () => {
    expect(formatSize(null)).toBe('2 B');
    expect(formatSize(undefined)).toBe('2 B');
  });
});
