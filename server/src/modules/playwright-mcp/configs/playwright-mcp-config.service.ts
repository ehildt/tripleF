import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

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
