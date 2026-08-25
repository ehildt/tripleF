import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { CoreLoggerSchema } from '@triplef/core-logger';
import type { LoggerOptions } from 'pino';

import { CoreLoggerConfigAdapter } from './core-logger-config.adapter.js';

@Injectable()
export class CoreLoggerConfigService {
  @CacheReturnValue(CoreLoggerSchema)
  get config(): LoggerOptions {
    return CoreLoggerConfigAdapter();
  }
}
