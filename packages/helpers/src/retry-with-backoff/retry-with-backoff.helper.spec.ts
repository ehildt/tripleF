import { retryWithBackoff } from './retry-with-backoff.helper.ts';

describe('retryWithBackoff', () => {
  it('returns the task result on the first attempt', async () => {
    const task = vi.fn().mockResolvedValue('ok');
    await expect(retryWithBackoff(task)).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('retries until the task succeeds', async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('ok');
    await expect(retryWithBackoff(task, { attempts: 3, initialDelayMs: 1, jitter: false })).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('rethrows the last error when attempts are exhausted', async () => {
    const task = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(retryWithBackoff(task, { attempts: 2, initialDelayMs: 1, jitter: false })).rejects.toThrow('boom');
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('defaults to 3 attempts', async () => {
    const task = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(retryWithBackoff(task, { initialDelayMs: 1, jitter: false })).rejects.toThrow('boom');
    expect(task).toHaveBeenCalledTimes(3);
  });

  it('uses a custom sleep function', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const task = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('ok');
    await retryWithBackoff(task, { attempts: 2, sleep });
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('applies backoffFactor to the delay', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const task = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(
      retryWithBackoff(task, {
        attempts: 3,
        initialDelayMs: 100,
        backoffFactor: 3,
        jitter: false,
        sleep,
      }),
    ).rejects.toThrow('boom');
    expect(sleep).toHaveBeenNthCalledWith(1, 100, undefined);
    expect(sleep).toHaveBeenNthCalledWith(2, 300, undefined);
  });

  it('applies full jitter by default', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const task = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(retryWithBackoff(task, { attempts: 2, initialDelayMs: 100, sleep })).rejects.toThrow('boom');
    const [delayMs] = sleep.mock.calls[0];
    expect(delayMs).toBeGreaterThanOrEqual(0);
    expect(delayMs).toBeLessThanOrEqual(100);
  });

  it('respects shouldRetry', async () => {
    const task = vi.fn().mockRejectedValue(new Error('boom'));
    const shouldRetry = vi.fn().mockReturnValue(false);
    await expect(retryWithBackoff(task, { attempts: 3, shouldRetry })).rejects.toThrow('boom');
    expect(task).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  it('invokes onRetry before each retry', async () => {
    const onRetry = vi.fn();
    const task = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('ok');
    await retryWithBackoff(task, {
      attempts: 2,
      initialDelayMs: 1,
      jitter: false,
      onRetry,
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 1);
  });

  it('aborts when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const task = vi.fn().mockResolvedValue('ok');
    await expect(retryWithBackoff(task, { signal: controller.signal })).rejects.toThrow();
    expect(task).not.toHaveBeenCalled();
  });
});
