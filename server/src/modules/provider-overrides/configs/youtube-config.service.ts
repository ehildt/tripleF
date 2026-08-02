import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

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
