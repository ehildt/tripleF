import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  EodhdConfig,
  EodhdConfigAdapter,
  EodhdConfigSchema,
} from './eodhd-config.adapter.js';

@Injectable()
export class EodhdConfigService {
  @CacheReturnValue(EodhdConfigSchema)
  get config(): EodhdConfig {
    return EodhdConfigAdapter();
  }
}
