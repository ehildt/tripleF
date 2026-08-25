import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import Joi from 'joi';

import { SourceBudgetConfigAdapter } from './source-budget-config.adapter.js';
import type { SourceBudgetConfig } from './source-budget-config.service.types.js';

const schema = Joi.object<SourceBudgetConfig>({
  sourceBudgetRatio: Joi.number().min(0).max(1),
  sourceBudgetChars: Joi.number().integer().min(0),
  referenceDocRatio: Joi.number().min(0).max(1),
  referenceDocChars: Joi.number().integer().min(0),
  gatheredTotalRatio: Joi.number().min(0).max(1),
  gatheredTotalChars: Joi.number().integer().min(0),
});

@Injectable()
export class SourceBudgetConfigService {
  @CacheReturnValue(schema)
  get config(): SourceBudgetConfig {
    return SourceBudgetConfigAdapter();
  }
}
