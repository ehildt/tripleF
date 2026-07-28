import { Injectable } from '@nestjs/common';

import { PinoLoggerService } from '../../pino-logger/services/pino-logger.service.js';

import type { HarnessContext } from './harness-context.type.js';

export type StepLoggerContext =
  Pick<HarnessContext, 'requestId'> | { requestId?: string };

@Injectable()
export class HarnessStepLogger {
  constructor(private readonly logger: PinoLoggerService) {}

  log(
    ctx: StepLoggerContext,
    step: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.log(
      this.buildBindings(ctx, step, meta),
      `[HARNESS] ${step}: ${message}`,
    );
  }

  warn(
    ctx: StepLoggerContext,
    step: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.warn(
      this.buildBindings(ctx, step, meta),
      `[HARNESS] ${step}: ${message}`,
    );
  }

  error(
    ctx: StepLoggerContext,
    step: string,
    message: string,
    error?: unknown,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.error(
      {
        ...this.buildBindings(ctx, step, meta),
        err: this.normalizeError(error),
      },
      `[HARNESS] ${step}: ${message}`,
    );
  }

  private buildBindings(
    ctx: StepLoggerContext,
    step: string,
    meta?: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      step,
      ...meta,
    };
  }

  /**
   * Real Errors pass through untouched so pino's `err` serializer emits the
   * stack trace; anything else (rejection values, strings) is wrapped so the
   * `err` key always holds a genuine Error instance.
   */
  private normalizeError(error: unknown): Error | undefined {
    if (error === undefined || error === null) return undefined;
    if (error instanceof Error) return error;
    return new Error(String(error));
  }
}
