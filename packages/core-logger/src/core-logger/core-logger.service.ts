import { Inject, Injectable, type LoggerService, type LogLevel } from '@nestjs/common';
import pino, { type Level, type Logger, type LoggerOptions } from 'pino';

export const CORE_LOGGER_OPTIONS = Symbol('CORE_LOGGER_OPTIONS');

/** NestJS log levels ordered from most to least verbose. */
const NEST_LOG_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];

/** Maps a NestJS log level to the pino threshold that enables it. */
const NEST_TO_PINO_LEVEL: Record<LogLevel, Level> = {
  verbose: 'trace',
  debug: 'debug',
  log: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal',
};

/**
 * NestJS `LoggerService` backed by pino. The service owns the pino client
 * and delegates the documented NestJS call shapes to it:
 *
 * - `log(message, context?)` — the trailing string that NestJS's static
 *   `Logger` appends is rendered as the `context` binding
 * - `log(bindings, message, context?)` — pino's object-first form
 * - `error(message, stack, context?)` — the stack is rendered verbatim under
 *   the `stack` binding (pino's `err` serializer expects an Error)
 * - `error(error, context?)` / `error(message, error, context?)` — Error
 *   instances go through pino's `err` serializer (type, message, stack)
 */
@Injectable()
export class CoreLoggerService implements LoggerService {
  private readonly logger: Logger;

  constructor(@Inject(CORE_LOGGER_OPTIONS) options: LoggerOptions) {
    this.logger = pino(options);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('trace', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('fatal', message, optionalParams);
  }

  setLogLevels(levels: LogLevel[]): void {
    const level = NEST_LOG_LEVELS.find((candidate) => levels.includes(candidate));
    this.logger.level = level ? NEST_TO_PINO_LEVEL[level] : 'silent';
  }

  private write(method: Level, first: unknown, rest: unknown[]): void {
    // Bind the pino instance: pino's log methods (especially the
    // `logMethod`-hook-wrapped variants) rely on `this` being the logger.
    // Calling the extracted method unbound leaves `this` undefined and
    // crashes inside pino's `LOG` (msgPrefix lookup).
    const logMethod = this.logger[method].bind(this.logger) as (...args: unknown[]) => void;
    const params = [...rest];

    if (this.isPlainObject(first)) {
      // pino object-first form: `log(bindings, message, context)`. The
      // context string sits after the message, so it is only popped when
      // both are present.
      const context = params.length > 1 ? this.popContext(params) : undefined;
      const message = typeof params[0] === 'string' ? (params.shift() as string) : '';
      logMethod({ ...first, ...this.contextBinding(context) }, message, ...params);
      return;
    }

    const context = this.popContext(params);
    const bindings = this.contextBinding(context);

    const metaIndex = params.findIndex((param) => this.isPlainObject(param));
    if (metaIndex >= 0) Object.assign(bindings, params.splice(metaIndex, 1)[0]);

    if (first instanceof Error) {
      bindings.err = first;
      logMethod(bindings, first.message, ...params);
      return;
    }

    // error(message, failure, context): an Error at any level, a bare stack
    // string only at error level (where NestJS passes it positionally).
    const failureIndex = params.findIndex(
      (param) => param instanceof Error || (method === 'error' && typeof param === 'string'),
    );
    if (failureIndex >= 0) {
      const failure = params.splice(failureIndex, 1)[0];
      if (failure instanceof Error) bindings.err = failure;
      else bindings.stack = failure;
    }

    const message = first == null ? '' : String(first);
    if (Object.keys(bindings).length) {
      logMethod(bindings, message, ...params);
      return;
    }
    logMethod(message, ...params);
  }

  /** Pops the trailing context string appended by NestJS's static `Logger`. */
  private popContext(params: unknown[]): string | undefined {
    return typeof params.at(-1) === 'string' ? (params.pop() as string) : undefined;
  }

  private contextBinding(context: string | undefined): Record<string, unknown> {
    return context ? { context } : {};
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Error);
  }
}
