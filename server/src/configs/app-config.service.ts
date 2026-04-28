import { AppConfigSchema } from '@ehildt/ckir-helpers/bootstrap';
import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

import { AppConfigAdapter } from './app-config.adapter.js';

@Injectable()
export class AppConfigService {
  @CacheReturnValue(AppConfigSchema)
  get config() {
    return AppConfigAdapter();
  }
}
