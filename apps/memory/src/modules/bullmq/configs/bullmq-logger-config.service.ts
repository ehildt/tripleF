import { BullMQLoggerSchema } from '@ehildt/nestjs-bullmq-logger';
import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { createBullMQLoggerOptions } from '@triplef/helpers/logger-options';
import type { LoggerOptions } from 'pino';

@Injectable()
export class BullMQLoggerConfigService {
  @CacheReturnValue(BullMQLoggerSchema)
  get config(): LoggerOptions {
    return createBullMQLoggerOptions();
  }
}
