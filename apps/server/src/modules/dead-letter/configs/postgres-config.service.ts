import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  PostgresConfigAdapter,
  PostgresConfigSchema,
} from './postgres-config.adapter.js';

@Injectable()
export class PostgresConfigService {
  @CacheReturnValue(PostgresConfigSchema)
  get config() {
    return PostgresConfigAdapter();
  }
}
