import { Global, Module } from '@nestjs/common';

import { OllamaConfigService } from './configs/ollama-config.service.js';
import { OllamaOverridesController } from './controllers/ollama-overrides.controller.js';
import { AiSdkService } from './services/ai-sdk.service.js';
import { ModelWarmupService } from './services/model-warmup.service.js';
import { OllamaModelsService } from './services/ollama-models.service.js';
import { OllamaOverridesService } from './services/ollama-overrides.service.js';

@Global()
@Module({
  controllers: [OllamaOverridesController],
  providers: [
    OllamaConfigService,
    OllamaOverridesService,
    AiSdkService,
    OllamaModelsService,
    ModelWarmupService,
  ],
  exports: [
    OllamaConfigService,
    OllamaOverridesService,
    AiSdkService,
    OllamaModelsService,
    ModelWarmupService,
  ],
})
export class AiSdkModule {}
