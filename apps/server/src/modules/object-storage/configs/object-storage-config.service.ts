import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  ObjectStorageConfigAdapter,
  ObjectStorageConfigSchema,
} from './object-storage-config.adapter.js';

@Injectable()
export class ObjectStorageConfigService {
  @CacheReturnValue(ObjectStorageConfigSchema)
  get config() {
    return ObjectStorageConfigAdapter();
  }
}
