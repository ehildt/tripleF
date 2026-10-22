import { Injectable } from '@nestjs/common';
import { BullMQConfigSchema } from '@triplef/bullmq';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { z } from 'zod';

import {
  BullMQConfigAdapter,
  ExtendedBullMQConfig,
} from './bullmq-config.adapter.js';

const ExtendedBullMQConfigSchema = z.strictObject({
  ...BullMQConfigSchema.shape,
  failedJobRetryDelayMs: z.number().int().min(0).optional(),
  failedJobReinstateBatchSize: z.number().int().min(1).optional(),
});

@Injectable()
export class BullMQConfigService {
  @CacheReturnValue(ExtendedBullMQConfigSchema)
  get config(): ExtendedBullMQConfig {
    return BullMQConfigAdapter();
  }
}
