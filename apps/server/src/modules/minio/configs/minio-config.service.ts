import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  MinioConfigAdapter,
  MinioConfigSchema,
} from './minio-config.adapter.js';

@Injectable()
export class MinioConfigService {
  @CacheReturnValue(MinioConfigSchema)
  get config() {
    return MinioConfigAdapter();
  }
}
