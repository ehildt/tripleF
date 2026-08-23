import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  PlaywrightMcpConfig,
  PlaywrightMcpConfigAdapter,
  PlaywrightMcpConfigSchema,
} from './playwright-mcp-config.adapter.js';

@Injectable()
export class PlaywrightMcpConfigService {
  @CacheReturnValue(PlaywrightMcpConfigSchema)
  get config(): PlaywrightMcpConfig {
    return PlaywrightMcpConfigAdapter();
  }
}
