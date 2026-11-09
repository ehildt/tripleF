import { describe, expect, it } from 'vitest';

import { parseMemoryCognition } from './parse-memory-cognition.helper';

describe('parseMemoryCognition', () => {
  it('trims saved ids and preserves an explicit empty value only as default', () => {
    expect(parseMemoryCognition(' personal ')).toBe('personal');
    expect(parseMemoryCognition(' ')).toBe('default');
    expect(parseMemoryCognition(null)).toBe('default');
  });
});
