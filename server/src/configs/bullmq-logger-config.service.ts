import { BullMQLoggerSchema } from '@ehildt/nestjs-bullmq-logger';
import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';
import type { LoggerOptions } from 'pino';

import { BullMQLoggerConfigAdapter } from './bullmq-logger-config.adapter.js';

@Injectable()
export class BullMQLoggerConfigService {
  @CacheReturnValue(BullMQLoggerSchema)
  get config(): LoggerOptions {
    return BullMQLoggerConfigAdapter();
  }
}
