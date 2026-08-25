export type PinoLogMethod = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Structured payload handed to an `onLog` callback after a log is written.
 * `context` is the NestJS context (when present); `meta` is the user's
 * structured fields with `context` and `onLog` already stripped.
 */
export interface LogEntry {
  level: PinoLogMethod;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
}

/**
 * Post-log hook: invoked after the pino write, fire-and-forget, and
 * error-isolated (a throwing or rejecting callback never breaks the log).
 */
export type LogCallback = (entry: LogEntry) => void | Promise<void>;

/**
 * Reserved keys in a log meta object. `onLog` is extracted before the meta
 * is written, so it never appears in the log output.
 */
export interface LogMeta extends Record<string, unknown> {
  onLog?: LogCallback;
}
