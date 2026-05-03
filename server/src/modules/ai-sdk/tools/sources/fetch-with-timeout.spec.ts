import { describe, expect, it, vi } from 'vitest';

import { fetchWithTimeout } from './fetch-with-timeout.js';

describe('fetchWithTimeout', () => {
  it('returns a successful response without retry', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const res = await fetchWithTimeout(
      'https://example.com',
      {},
      { retries: 0 },
    );

    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });

  it('retries on transient timeout errors', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(
        new Error('The operation was aborted due to timeout'),
      )
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    const res = await fetchWithTimeout(
      'https://example.com',
      {},
      { retries: 1 },
    );

    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });

  it('throws after exhausting retries', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('The operation was aborted due to timeout'));

    await expect(
      fetchWithTimeout('https://example.com', {}, { retries: 1 }),
    ).rejects.toThrow();
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });

  it('does not retry non-transient errors', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockRejectedValue(new TypeError('Failed to parse URL'));

    await expect(
      fetchWithTimeout('https://example.com', {}, { retries: 1 }),
    ).rejects.toThrow('Failed to parse URL');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });
});
