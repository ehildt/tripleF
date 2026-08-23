import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import type { QdrantConfig } from '../models/qdrant-config.model.js';
import { QdrantConfigSchema } from '../schema/qdrant-config.schema.js';

import { QdrantConfigAdapter } from './qdrant-config.adapter.js';

@Injectable()
export class QdrantConfigService {
  @CacheReturnValue(QdrantConfigSchema)
  get config(): QdrantConfig {
    return QdrantConfigAdapter();
  }
}
