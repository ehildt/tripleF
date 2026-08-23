import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import type { LoggerOptions } from 'pino';

import {
  PinoLoggerConfigAdapter,
  PinoLoggerSchema,
} from './pino-logger-config.adapter.js';

@Injectable()
export class PinoLoggerConfigService {
  @CacheReturnValue(PinoLoggerSchema)
  get config(): LoggerOptions {
    return PinoLoggerConfigAdapter();
  }
}
