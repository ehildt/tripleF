import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { OllamaConfigSchema } from '@ehildt/nestjs-ollama';
import { Injectable } from '@nestjs/common';
import Joi from 'joi';
import { Config } from 'ollama';

import {
  OllamaConfigAdapter,
  OllamaSystemPrompts,
} from './ollama-config.adapter.js';

const extendedSchema = OllamaConfigSchema.concat(
  Joi.object({
    keepAlive: Joi.string().optional(),
    systemPrompts: Joi.object({
      DESCRIBE: Joi.string().optional(),
      COMPARE: Joi.string().optional(),
      OCR: Joi.string().optional(),
    }).optional(),
  }),
);

type OllamaConfig = Config & {
  keepAlive: string;
  systemPrompts: OllamaSystemPrompts;
};

@Injectable()
export class OllamaConfigService {
  @CacheReturnValue(extendedSchema)
  get config(): OllamaConfig {
    return OllamaConfigAdapter() as OllamaConfig;
  }
}
