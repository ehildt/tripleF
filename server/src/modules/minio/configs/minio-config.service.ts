import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

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
