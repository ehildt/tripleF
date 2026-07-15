import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

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
