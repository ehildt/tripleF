import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  YoutubeConfig,
  YoutubeConfigAdapter,
  YoutubeConfigSchema,
} from './youtube-config.adapter.js';

@Injectable()
export class YoutubeConfigService {
  @CacheReturnValue(YoutubeConfigSchema)
  get config(): YoutubeConfig {
    return YoutubeConfigAdapter();
  }
}
