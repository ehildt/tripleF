import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import Joi from 'joi';

import { OllamaConfigAdapter } from './ollama-config.adapter.js';
import type { OllamaConfig } from './ollama-config.types.js';

const extendedSchema = Joi.object({
  host: Joi.string().optional(),
  apiKey: Joi.string().optional(),
  keepAlive: Joi.string().optional(),
  streamChunkTimeoutMs: Joi.number().integer().min(1000).optional(),
  streamTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
  generateTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
  enableSmoothStream: Joi.boolean().optional(),
});

@Injectable()
export class OllamaConfigService {
  @CacheReturnValue(extendedSchema)
  get config(): OllamaConfig {
    return OllamaConfigAdapter() as OllamaConfig;
  }
}
