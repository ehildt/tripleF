import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

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
