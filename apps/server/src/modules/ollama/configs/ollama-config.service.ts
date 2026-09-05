import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { OllamaApiConfigSchema } from '@triplef/ollama-api';

import { OllamaConfigAdapter } from './ollama-config.adapter.js';
import type { OllamaConfig } from './ollama-config.types.js';

@Injectable()
export class OllamaConfigService {
  @CacheReturnValue(OllamaApiConfigSchema)
  get config(): OllamaConfig {
    return OllamaConfigAdapter() as OllamaConfig;
  }
}
