import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  type SourcesConfig,
  SourcesConfigAdapter,
  SourcesConfigSchema,
} from './sources-config.adapter.js';

@Injectable()
export class SourcesConfigService {
  @CacheReturnValue(SourcesConfigSchema)
  get config(): SourcesConfig {
    return SourcesConfigAdapter();
  }
}
