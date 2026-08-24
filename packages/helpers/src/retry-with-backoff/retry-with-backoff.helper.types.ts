export interface RetryWithBackoffOptions {
  /** Total attempts including the first one. Defaults to 3. */
  attempts?: number;
  /** Delay before the first retry; multiplied by backoffFactor each attempt. Defaults to 500ms. */
  initialDelayMs?: number;
  /** Upper bound for the per-attempt delay. Defaults to 16_000ms. */
  maxDelayMs?: number;
  /** Multiplier applied to the delay on each retry. Defaults to 2. */
  backoffFactor?: number;
  /** When true, apply full jitter (random delay between 0 and the exponential delay). Defaults to true. */
  jitter?: boolean;
  /** AbortSignal to cancel pending retries. */
  signal?: AbortSignal;
  /** Predicate deciding whether to retry after an error. Defaults to always retry. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback invoked before each retry with the error, attempt, and computed delay. */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  /** Injectable sleep — tests advance time without waiting. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}
