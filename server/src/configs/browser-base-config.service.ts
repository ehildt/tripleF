import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

import {
  BrowserBaseConfig,
  BrowserBaseConfigAdapter,
  BrowserBaseConfigSchema,
} from './browser-base-config.adapter.js';

@Injectable()
export class BrowserBaseConfigService {
  @CacheReturnValue(BrowserBaseConfigSchema)
  get config(): BrowserBaseConfig {
    return BrowserBaseConfigAdapter();
  }
}
