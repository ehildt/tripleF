import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

import {
  SearXNGConfig,
  SearXNGConfigAdapter,
  SearXNGConfigSchema,
} from './searxng-config.adapter.js';

@Injectable()
export class SearXNGConfigService {
  @CacheReturnValue(SearXNGConfigSchema)
  get config(): SearXNGConfig {
    return SearXNGConfigAdapter();
  }
}
