import { defaultSleep } from './default-sleep.helper.ts';
import type { RetryWithBackoffOptions } from './retry-with-backoff.helper.types.ts';

/**
 * Run an async task, retrying with exponential backoff (and optional full
 * jitter) until it succeeds, the attempts are exhausted, the signal aborts,
 * or a shouldRetry predicate declines. The final failure rethrows the last
 * error so callers decide between warning, fallback, or crashing.
 */
export async function retryWithBackoff<T>(task: () => Promise<T>, options: RetryWithBackoffOptions = {}): Promise<T> {
  const attempts = Math.max(1, Math.floor(options.attempts ?? 3));
  const initialDelayMs = Math.max(0, options.initialDelayMs ?? 500);
  const maxDelayMs = Math.max(initialDelayMs, options.maxDelayMs ?? 16_000);
  const backoffFactor = Math.max(1, options.backoffFactor ?? 2);
  const useJitter = options.jitter ?? true;
  const sleep = options.sleep ?? defaultSleep;
  const { signal, shouldRetry, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    signal?.throwIfAborted();

    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || signal?.aborted || (shouldRetry && !shouldRetry(error, attempt))) break;
      const exponentialDelay = Math.min(initialDelayMs * backoffFactor ** (attempt - 1), maxDelayMs);
      const delayMs = useJitter ? Math.floor(Math.random() * exponentialDelay) : exponentialDelay;
      if (onRetry) onRetry(error, attempt, delayMs);
      await sleep(delayMs, signal);
    }
  }

  throw lastError;
}
