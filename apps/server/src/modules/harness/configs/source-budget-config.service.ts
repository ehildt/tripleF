import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { z } from 'zod';

import { SourceBudgetConfigAdapter } from './source-budget-config.adapter.js';
import type { SourceBudgetConfig } from './source-budget-config.service.types.js';

const schema = z.strictObject({
  sourceBudgetRatio: z.number().min(0).max(1).optional(),
  sourceBudgetChars: z.number().int().min(0).optional(),
  referenceDocRatio: z.number().min(0).max(1).optional(),
  referenceDocChars: z.number().int().min(0).optional(),
  gatheredTotalRatio: z.number().min(0).max(1).optional(),
  gatheredTotalChars: z.number().int().min(0).optional(),
});

@Injectable()
export class SourceBudgetConfigService {
  @CacheReturnValue(schema)
  get config(): SourceBudgetConfig {
    return SourceBudgetConfigAdapter();
  }
}
