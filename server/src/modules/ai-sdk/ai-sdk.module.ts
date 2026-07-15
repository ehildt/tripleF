import { Global, Module } from '@nestjs/common';

import { OllamaConfigService } from './configs/ollama-config.service.js';
import { AiSdkService } from './services/ai-sdk.service.js';
import { OllamaModelsService } from './services/ollama-models.service.js';

@Global()
@Module({
  providers: [OllamaConfigService, AiSdkService, OllamaModelsService],
  exports: [OllamaConfigService, AiSdkService, OllamaModelsService],
})
export class AiSdkModule {}
