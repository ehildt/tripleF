import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

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
