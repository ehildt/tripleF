import { Injectable } from '@nestjs/common';

import { PinoLoggerService } from '../../../pino-logger/services/pino-logger.service.js';

import type { VectorizeContext } from './vectorize-context.type.js';

/** Step-scoped structured logging for the vectorize pipeline — mirrors HarnessStepLogger. */
@Injectable()
export class VectorizeStepLogger {
  constructor(private readonly logger: PinoLoggerService) {}

  log(
    ctx: Pick<VectorizeContext, 'jobId'>,
    step: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.log(
      { jobId: ctx.jobId, step, ...meta },
      `[VECTORIZE] ${step}: ${message}`,
    );
  }

  warn(
    ctx: Pick<VectorizeContext, 'jobId'>,
    step: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.warn(
      { jobId: ctx.jobId, step, ...meta },
      `[VECTORIZE] ${step}: ${message}`,
    );
  }

  error(
    ctx: Pick<VectorizeContext, 'jobId'>,
    step: string,
    message: string,
    error?: unknown,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.error(
      {
        jobId: ctx.jobId,
        step,
        err: error instanceof Error ? error.message : error,
        ...meta,
      },
      `[VECTORIZE] ${step}: ${message}`,
    );
  }
}
