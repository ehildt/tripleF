import { Injectable } from '@nestjs/common';
import { BullMQLoggerSchema } from '@triplef/bullmq-logger';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import type { LoggerOptions } from 'pino';

import { BullMQLoggerConfigAdapter } from './bullmq-logger-config.adapter.js';

@Injectable()
export class BullMQLoggerConfigService {
  @CacheReturnValue(BullMQLoggerSchema)
  get config(): LoggerOptions {
    return BullMQLoggerConfigAdapter();
  }
}
