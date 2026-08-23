import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  SecretsConfig,
  SecretsConfigAdapter,
  SecretsConfigSchema,
} from './secrets-config.adapter.js';

@Injectable()
export class SecretsConfigService {
  @CacheReturnValue(SecretsConfigSchema)
  get config(): SecretsConfig {
    return SecretsConfigAdapter();
  }
}
