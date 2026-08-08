import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

import {
  type LayoutsConfig,
  LayoutsConfigAdapter,
  LayoutsConfigSchema,
} from './layouts-config.adapter.js';

@Injectable()
export class LayoutsConfigService {
  @CacheReturnValue(LayoutsConfigSchema)
  get config(): LayoutsConfig {
    return LayoutsConfigAdapter();
  }
}
