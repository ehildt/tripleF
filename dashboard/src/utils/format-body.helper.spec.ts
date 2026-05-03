import { describe, expect, it } from 'vitest';

import { formatBody } from './format-body.helper';

describe('formatBody', () => {
  it('returns empty string for undefined', () => {
    expect(formatBody(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatBody('')).toBe('');
  });

  it('formats an object', () => {
    expect(formatBody({ a: 1 })).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it('parses and formats json string', () => {
    expect(formatBody('{"b":2}')).toBe(JSON.stringify({ b: 2 }, null, 2));
  });

  it('returns plain string unchanged', () => {
    expect(formatBody('hello')).toBe('hello');
  });
});
