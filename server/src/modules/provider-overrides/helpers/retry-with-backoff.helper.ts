import type { RetryWithBackoffOptions } from './retry-with-backoff.helper.types.js';

/**
 * Run an async task, retrying with exponential backoff until it succeeds or
 * the attempts are exhausted. The final failure rethrows the last error so
 * callers decide between warning, fallback, or crashing.
 */
export async function retryWithBackoff<T>(
  task: () => Promise<T>,
  options: RetryWithBackoffOptions = {},
): Promise<T> {
  const attempts = Math.max(1, Math.floor(options.attempts ?? 1));
  const initialDelayMs = Math.max(0, options.initialDelayMs ?? 500);
  const maxDelayMs = Math.max(initialDelayMs, options.maxDelayMs ?? 16_000);
  const sleep =
    options.sleep ??
    ((ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      }));

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(Math.min(initialDelayMs * 2 ** (attempt - 1), maxDelayMs));
      }
    }
  }
  throw lastError;
}
