import { describe, expect, it } from 'vitest';

import { formatResponseBody } from './format-response-body.helper';

describe('formatResponseBody', () => {
  it('formats valid JSON', async () => {
    const result = await formatResponseBody('{"a":1}');
    expect(result).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it('returns raw text for invalid JSON', async () => {
    const result = await formatResponseBody('hello');
    expect(result).toBe('hello');
  });
});
