import { describe, expect, it, vi } from 'vitest';

import { retryWithBackoff } from './retry-with-backoff.helper.js';

describe('retryWithBackoff', () => {
  it('returns the task result on the first attempt', async () => {
    const task = vi.fn().mockResolvedValue('ok');
    await expect(retryWithBackoff(task)).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('retries until the task succeeds', async () => {
    const task = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');
    await expect(
      retryWithBackoff(task, { attempts: 3, initialDelayMs: 1 }),
    ).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('rethrows the last error when attempts are exhausted', async () => {
    const task = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(
      retryWithBackoff(task, { attempts: 2, initialDelayMs: 1 }),
    ).rejects.toThrow('boom');
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('uses a custom sleep function', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const task = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');
    await retryWithBackoff(task, { attempts: 2, sleep });
    expect(sleep).toHaveBeenCalledTimes(1);
  });
});
