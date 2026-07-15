import { BullMQConfigSchema } from '@ehildt/nestjs-bullmq';
import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';
import Joi from 'joi';

import {
  BullMQConfigAdapter,
  ExtendedBullMQConfig,
} from './bullmq-config.adapter.js';

const ExtendedBullMQConfigSchema = BullMQConfigSchema.concat(
  Joi.object({
    failedJobRetryDelayMs: Joi.number().integer().min(0).optional(),
    failedJobReinstateBatchSize: Joi.number().integer().min(1).optional(),
  }),
);

@Injectable()
export class BullMQConfigService {
  @CacheReturnValue(ExtendedBullMQConfigSchema)
  get config(): ExtendedBullMQConfig {
    return BullMQConfigAdapter();
  }
}
