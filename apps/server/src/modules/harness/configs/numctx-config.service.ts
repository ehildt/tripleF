import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import Joi from 'joi';

import { NumCtxConfigAdapter } from './numctx-config.adapter.js';
import type { NumCtxConfig } from './numctx-config.service.types.js';

const schema = Joi.array().items(Joi.number().integer().min(1));

@Injectable()
export class NumCtxConfigService {
  @CacheReturnValue(schema)
  get config(): NumCtxConfig {
    return NumCtxConfigAdapter();
  }
}
