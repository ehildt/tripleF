import { describe, expect, it } from 'vitest';

import { parseUrl } from './parse-url.helper';

describe('parseUrl', () => {
  it('returns empty for empty string', () => {
    expect(parseUrl('')).toEqual({ path: '', params: [] });
  });

  it('parses simple path without query', () => {
    expect(parseUrl('/api/v1/harness')).toEqual({
      path: '/api/v1/harness',
      params: [],
    });
  });

  it('parses URL with search params', () => {
    const result = parseUrl('/api/v1/harness?a=1&b=hello');
    expect(result.path).toBe('/api/v1/harness');
    expect(result.params).toContainEqual({ key: 'a', value: '1' });
    expect(result.params).toContainEqual({ key: 'b', value: 'hello' });
  });

  it('decodes encoded params', () => {
    const result = parseUrl('/path?key=%20value');
    expect(result.params).toContainEqual({ key: 'key', value: ' value' });
  });

  it('handles string without query via URL constructor with base', () => {
    expect(parseUrl('not a url')).toEqual({
      path: '/not%20a%20url',
      params: [],
    });
  });
});
