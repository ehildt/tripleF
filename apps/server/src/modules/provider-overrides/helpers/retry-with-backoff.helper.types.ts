export interface RetryWithBackoffOptions {
  /** Total attempts including the first one. Defaults to 1 (no retry). */
  attempts?: number;
  /** Delay before the first retry; doubles each attempt. Defaults to 500ms. */
  initialDelayMs?: number;
  /** Upper bound for the per-attempt delay. Defaults to 16_000ms. */
  maxDelayMs?: number;
  /** Injectable sleep — tests advance time without waiting. */
  sleep?: (ms: number) => Promise<void>;
}
