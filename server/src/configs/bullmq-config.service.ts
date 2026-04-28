import { BullMQConfig, BullMQConfigSchema } from '@ehildt/nestjs-bullmq';
import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';

import { BullMQConfigAdapter } from './bullmq-config.adapter.js';

@Injectable()
export class BullMQConfigService {
  @CacheReturnValue(BullMQConfigSchema)
  get config(): BullMQConfig {
    return BullMQConfigAdapter();
  }
}
