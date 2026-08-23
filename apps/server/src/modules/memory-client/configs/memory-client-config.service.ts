import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import type { MemoryClientConfig } from './memory-client-config.adapter.js';
import { MemoryClientConfigAdapter } from './memory-client-config.adapter.js';
import { MemoryClientConfigSchema } from './memory-client-config.schema.js';

@Injectable()
export class MemoryClientConfigService {
  @CacheReturnValue(MemoryClientConfigSchema)
  get config(): MemoryClientConfig {
    return MemoryClientConfigAdapter();
  }
}
