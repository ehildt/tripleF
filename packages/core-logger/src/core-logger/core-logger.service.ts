import { Inject, Injectable, type LoggerService, type LogLevel } from '@nestjs/common';
import type { LoggerOptions } from 'pino';
import pino from 'pino';

import type { LogCallback, LogMeta, PinoLogMethod } from './core-logger.service.types.ts';

export const CORE_LOGGER_OPTIONS = Symbol('CORE_LOGGER_OPTIONS');

/** NestJS log levels ordered from most to least verbose. */
const NEST_LOG_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];

/** Maps a NestJS log level to the pino threshold that enables it. */
const NEST_TO_PINO_LEVEL: Record<LogLevel, PinoLogMethod> = {
  verbose: 'trace',
  debug: 'debug',
  log: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal',
};

/** Matches a stack trace string (NestJS's own `isStackFormat` heuristic). */
const STACK_TRACE_PATTERN = /^(.)+\n\s+at .+:\d+:\d+/;

interface NormalizedArgs {
  meta?: Record<string, unknown>;
  msg?: string;
  rest: unknown[];
  onLog?: LogCallback;
}

/**
 * NestJS `LoggerService` backed by pino. Normalizes the call shapes NestJS
 * forwards (`log(message, context)`, `error(message, stack, context)`, and
 * the meta-object-first/second forms) into pino calls, then invokes an
 * optional per-call `onLog` hook.
 */
@Injectable()
export class CoreLoggerService implements LoggerService {
  private readonly logger: pino.Logger;

  constructor(@Inject(CORE_LOGGER_OPTIONS) options: LoggerOptions) {
    this.logger = pino(options);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.call('info', message, ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.call('error', message, ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.call('warn', message, ...optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.call('debug', message, ...optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.call('trace', message, ...optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.call('fatal', message, ...optionalParams);
  }

  setLogLevels(levels: LogLevel[]): void {
    this.logger.level = this.resolveLevel(levels);
  }

  private call(level: PinoLogMethod, message: unknown, ...optionalParams: unknown[]): void {
    const { meta, msg, rest, onLog } = this.normalizeArgs(level, message, optionalParams);

    if (meta) (this.logger[level] as (...args: unknown[]) => void)(meta, msg ?? '', ...rest);
    else (this.logger[level] as (...args: unknown[]) => void)(msg ?? '', ...rest);

    const { context, ...fields } = meta ?? {};
    void onLog?.({
      level,
      message: msg ?? '',
      context: typeof context === 'string' ? context : undefined,
      meta: Object.keys(fields).length > 0 ? fields : undefined,
    });
  }

  private normalizeArgs(level: PinoLogMethod, first: unknown, rest: unknown[]): NormalizedArgs {
    if (first === undefined || first === null) return { rest };
    if (typeof first === 'string') return this.normalizeStringArgs(level, first, rest);

    if (this.isPlainObject(first)) {
      // log({ meta, onLog }, 'message', ...)
      const msg = typeof rest[0] === 'string' ? rest[0] : undefined;
      const remaining = msg === undefined ? rest : rest.slice(1);
      return this.splitMeta(first as LogMeta, msg, remaining);
    }

    return { msg: String(first), rest };
  }

  private normalizeStringArgs(level: PinoLogMethod, first: string, rest: unknown[]): NormalizedArgs {
    if (rest.length > 0 && this.isPlainObject(rest[0]))
      // log('message', { meta, onLog })
      return this.splitMeta(rest[0] as LogMeta, first, rest.slice(1));

    // Error stack: NestJS error(message, stack?, context?) — detect the
    // stack string before context so a bare stack isn't mistaken for it.
    let remaining = rest;
    let meta: Record<string, unknown> | undefined;
    if (level === 'error') {
      const stackIndex = remaining.findIndex((arg) => this.isStackTrace(arg));
      if (stackIndex >= 0) {
        meta = { err: remaining[stackIndex] as string };
        remaining = remaining.filter((_, index) => index !== stackIndex);
      }
    }

    // NestJS pattern: log('message', ..., 'Context')
    const contextIndex = this.findLastStringIndex(remaining);
    if (contextIndex >= 0) {
      const context = remaining[contextIndex] as string;
      remaining = remaining.filter((_, index) => index !== contextIndex);
      meta = { ...(meta ?? {}), context };
    }

    return { meta, msg: first, rest: remaining };
  }

  /** Splits the reserved `onLog` key out of a user meta object. */
  private splitMeta(meta: LogMeta, msg: string | undefined, rest: unknown[]): NormalizedArgs {
    const { onLog, ...fields } = meta;
    return {
      meta: Object.keys(fields).length > 0 ? fields : undefined,
      msg,
      rest,
      onLog: typeof onLog === 'function' ? onLog : undefined,
    };
  }

  private resolveLevel(levels: LogLevel[]): PinoLogMethod | 'silent' {
    for (const level of NEST_LOG_LEVELS) if (levels.includes(level)) return NEST_TO_PINO_LEVEL[level];
    return 'silent';
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isStackTrace(value: unknown): value is string {
    return typeof value === 'string' && STACK_TRACE_PATTERN.test(value);
  }

  private findLastStringIndex(args: unknown[]): number {
    for (let i = args.length - 1; i >= 0; i--) if (typeof args[i] === 'string') return i;
    return -1;
  }
}
