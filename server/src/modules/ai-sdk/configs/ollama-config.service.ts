import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';
import Joi from 'joi';

import { OllamaConfigAdapter } from './ollama-config.adapter.js';

const extendedSchema = Joi.object({
  host: Joi.string().optional(),
  apiKey: Joi.string().optional(),
  keepAlive: Joi.string().optional(),
  streamChunkTimeoutMs: Joi.number().integer().min(1000).optional(),
  streamTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
  generateTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
  enableSmoothStream: Joi.boolean().optional(),
});

type OllamaConfig = {
  host?: string;
  apiKey?: string;
  keepAlive: string;
  streamChunkTimeoutMs: number;
  streamTotalTimeoutMs: number;
  generateTotalTimeoutMs: number;
  enableSmoothStream: boolean;
};

@Injectable()
export class OllamaConfigService {
  @CacheReturnValue(extendedSchema)
  get config(): OllamaConfig {
    return OllamaConfigAdapter() as OllamaConfig;
  }
}
