import { describe, expect, it } from 'vitest';

import { sanitizeRequestBody } from './sanitize-request-body.helper';

describe('sanitizeRequestBody', () => {
  it('returns undefined for undefined input', () => {
    expect(sanitizeRequestBody(undefined)).toBeUndefined();
  });

  it('returns the body unchanged when it is not JSON', () => {
    expect(sanitizeRequestBody('plain text')).toBe('plain text');
  });

  it('replaces a base64-like string with its size', () => {
    const base64 = 'a'.repeat(101); // matches base64-like regex
    const body = JSON.stringify({ image: base64 });
    const result = sanitizeRequestBody(body);
    expect(result).toMatch(/\[BASE64: .* KB\]/);
  });

  it('leaves non-base64 strings intact', () => {
    const body = JSON.stringify({ message: 'hello world' });
    expect(sanitizeRequestBody(body)).toBe(body);
  });
});
