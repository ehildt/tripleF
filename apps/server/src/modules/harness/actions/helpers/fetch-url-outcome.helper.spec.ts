import { describe, expect, it, vi } from 'vitest';

import { fetchUrlOutcome } from './fetch-url-outcome.helper.js';

describe('fetchUrlOutcome', () => {
  it('captures a successful fetch result', async () => {
    const execute = vi.fn().mockResolvedValue('ok');
    expect(await fetchUrlOutcome('https://example.com', execute)).toEqual({
      url: 'https://example.com',
      result: 'ok',
    });
  });

  it('captures a fetch error', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('boom'));
    const result = await fetchUrlOutcome('https://example.com', execute);
    expect(result.url).toBe('https://example.com');
    expect(result.error).toBeInstanceOf(Error);
  });
});
