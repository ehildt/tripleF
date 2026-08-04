import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

import {
  BrightDataConfig,
  BrightDataConfigAdapter,
  BrightDataConfigSchema,
} from './bright-data-config.adapter.js';

@Injectable()
export class BrightDataConfigService {
  @CacheReturnValue(BrightDataConfigSchema)
  get config(): BrightDataConfig {
    return BrightDataConfigAdapter();
  }
}
