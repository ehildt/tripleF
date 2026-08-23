import { Global, Module } from '@nestjs/common';

import { OllamaConfigService } from './configs/ollama-config.service.js';
import { AiSdkService } from './services/ai-sdk.service.js';
import { OllamaModelsService } from './services/ollama-models.service.js';
import { OllamaOverridesService } from './services/ollama-overrides.service.js';

/**
 * Slim ai-sdk surface for the memory app: only the Ollama connection
 * (config + overrides + model catalog) and the text/tool generation
 * clients used by the vectorize pipeline. The chat-facing harness services
 * (tool selection, streaming) stay in the main server.
 */
@Global()
@Module({
  providers: [
    OllamaConfigService,
    OllamaOverridesService,
    AiSdkService,
    OllamaModelsService,
  ],
  exports: [
    OllamaConfigService,
    OllamaOverridesService,
    AiSdkService,
    OllamaModelsService,
  ],
})
export class AiSdkModule {}
