import { Module } from '@nestjs/common';

import { AiSdkService } from './services/ai-sdk.service.js';
import { OllamaModelsService } from './services/ollama-models.service.js';

@Module({
  providers: [AiSdkService, OllamaModelsService],
  exports: [AiSdkService, OllamaModelsService],
})
export class AiSdkModule {}
