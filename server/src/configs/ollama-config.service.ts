import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';
import Joi from 'joi';

import {
  OllamaConfigAdapter,
  OllamaDeveloperPrompts,
  OllamaSystemPrompts,
} from './ollama-config.adapter.js';

const baseSchema = Joi.object({
  host: Joi.string().optional(),
  headers: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
});

const extendedSchema = baseSchema.concat(
  Joi.object({
    keepAlive: Joi.string().optional(),
    systemPrompts: Joi.object({
      DESCRIBE: Joi.string().optional().allow(''),
      COMPARE: Joi.string().optional().allow(''),
      OCR: Joi.string().optional().allow(''),
    }).optional(),
    developerPrompts: Joi.object({
      IMAGE_CONSTRAINT: Joi.string().optional().allow(''),
      TEXT_CONSTRAINT: Joi.string().optional().allow(''),
    }).optional(),
    streamChunkTimeoutMs: Joi.number().integer().min(1000).optional(),
    streamTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
    generateTotalTimeoutMs: Joi.number().integer().min(1000).optional(),
    enableSmoothStream: Joi.boolean().optional(),
  }),
);

type OllamaClientConfig = {
  host?: string;
  headers?: Record<string, string>;
};

type OllamaConfig = OllamaClientConfig & {
  keepAlive: string;
  systemPrompts: OllamaSystemPrompts;
  developerPrompts: OllamaDeveloperPrompts;
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
