import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

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
