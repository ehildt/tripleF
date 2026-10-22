import { describe, expect, it } from 'vitest';

import { formatRequestBody } from './format-request-body.helper';

describe('formatRequestBody', () => {
  it('returns empty string for undefined', () => {
    expect(formatRequestBody(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatRequestBody('')).toBe('');
  });

  it('formats an object', () => {
    expect(formatRequestBody({ a: 1 })).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it('parses and formats json string', () => {
    expect(formatRequestBody('{"b":2}')).toBe(
      JSON.stringify({ b: 2 }, null, 2),
    );
  });

  it('returns plain string unchanged', () => {
    expect(formatRequestBody('hello')).toBe('hello');
  });
});
