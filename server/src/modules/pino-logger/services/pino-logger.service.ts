import { Inject, Injectable, LoggerService } from '@nestjs/common';
import type { LoggerOptions } from 'pino';
import pino from 'pino';

export const PINO_LOGGER_OPTIONS = Symbol('PINO_LOGGER_OPTIONS');

type PinoLogMethod = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: pino.Logger;

  constructor(@Inject(PINO_LOGGER_OPTIONS) options: LoggerOptions) {
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

  private call(
    level: PinoLogMethod,
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    const [meta, msg, rest] = this.normalizeArgs(message, optionalParams);

    if (meta) {
      (this.logger[level] as (...args: unknown[]) => void)(
        meta,
        msg ?? '',
        ...rest,
      );
    } else {
      (this.logger[level] as (...args: unknown[]) => void)(msg ?? '', ...rest);
    }
  }

  private normalizeArgs(
    first: unknown,
    rest: unknown[],
  ): [Record<string, unknown> | undefined, string | undefined, unknown[]] {
    if (first === undefined || first === null) {
      return [undefined, undefined, rest];
    }

    if (typeof first === 'string') {
      if (rest.length > 0 && this.isPlainObject(rest[0])) {
        // log('message', { meta }) -> pino.info({ meta }, 'message')
        return [rest[0] as Record<string, unknown>, first, rest.slice(1)];
      }

      // NestJS pattern: log('message', ..., 'Context')
      const contextIndex = this.findLastStringIndex(rest);
      if (contextIndex >= 0) {
        const context = rest[contextIndex] as string;
        const remaining = rest.filter((_, index) => index !== contextIndex);
        return [{ context }, first, remaining];
      }

      // log('message') or log('message', interpolation...)
      return [undefined, first, rest];
    }

    if (this.isPlainObject(first)) {
      // log({ meta }, 'message', ...) or log({ meta })
      const msg = typeof rest[0] === 'string' ? rest[0] : undefined;
      const remaining = msg === undefined ? rest : rest.slice(1);
      return [first as Record<string, unknown>, msg, remaining];
    }

    // log('message') or log(value)
    return [undefined, typeof first === 'string' ? first : String(first), rest];
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private findLastStringIndex(args: unknown[]): number {
    for (let i = args.length - 1; i >= 0; i--) {
      if (typeof args[i] === 'string') return i;
    }
    return -1;
  }
}
