import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { CoreLoggerSchema } from '@triplef/core-logger';
import { createCoreLoggerOptions } from '@triplef/helpers/logger-options';
import type { LoggerOptions } from 'pino';

@Injectable()
export class CoreLoggerConfigService {
  @CacheReturnValue(CoreLoggerSchema)
  get config(): LoggerOptions {
    return createCoreLoggerOptions();
  }
}
