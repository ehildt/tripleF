import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import type { ResearchConfig } from '../models/research-config.model.js';
import { ResearchConfigSchema } from '../schema/research-config.schema.js';

import { ResearchConfigAdapter } from './research-config.adapter.js';

@Injectable()
export class ResearchConfigService {
  @CacheReturnValue(ResearchConfigSchema)
  get config(): ResearchConfig {
    return ResearchConfigAdapter();
  }
}
