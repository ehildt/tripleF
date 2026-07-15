import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';
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
