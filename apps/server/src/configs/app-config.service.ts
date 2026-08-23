import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { AppConfigSchema } from '@triplef/helpers/bootstrap';

import { AppConfigAdapter } from './app-config.adapter.js';

@Injectable()
export class AppConfigService {
  @CacheReturnValue(AppConfigSchema)
  get config() {
    return AppConfigAdapter();
  }
}
