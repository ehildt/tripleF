import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

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
