import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import type { LexiconConfig } from '../models/lexicon-config.model.js';
import { LexiconConfigSchema } from '../schema/lexicon-config.schema.js';

import { LexiconConfigAdapter } from './lexicon-config.adapter.js';

@Injectable()
export class LexiconConfigService {
  @CacheReturnValue(LexiconConfigSchema)
  get config(): LexiconConfig {
    return LexiconConfigAdapter();
  }
}
