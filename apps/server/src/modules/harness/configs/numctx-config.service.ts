import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { z } from 'zod';

import { NumCtxConfigAdapter } from './numctx-config.adapter.js';
import type { NumCtxConfig } from './numctx-config.service.types.js';

const schema = z.array(z.number().int().min(1));

@Injectable()
export class NumCtxConfigService {
  @CacheReturnValue(schema)
  get config(): NumCtxConfig {
    return NumCtxConfigAdapter();
  }
}
