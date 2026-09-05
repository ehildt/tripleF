import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import type { EncyclopediaConfig } from '../models/encyclopedia-config.model.js';
import { EncyclopediaConfigSchema } from '../schema/encyclopedia-config.schema.js';

import { EncyclopediaConfigAdapter } from './encyclopedia-config.adapter.js';

@Injectable()
export class EncyclopediaConfigService {
  @CacheReturnValue(EncyclopediaConfigSchema)
  get config(): EncyclopediaConfig {
    return EncyclopediaConfigAdapter();
  }
}
