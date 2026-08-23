import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  SerperConfig,
  SerperConfigAdapter,
  SerperConfigSchema,
} from './serper-config.adapter.js';

@Injectable()
export class SerperConfigService {
  @CacheReturnValue(SerperConfigSchema)
  get config(): SerperConfig {
    return SerperConfigAdapter();
  }
}
