import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

import {
  BraveConfig,
  BraveConfigAdapter,
  BraveConfigSchema,
} from './brave-config.adapter.js';

@Injectable()
export class BraveConfigService {
  @CacheReturnValue(BraveConfigSchema)
  get config(): BraveConfig {
    return BraveConfigAdapter();
  }
}
