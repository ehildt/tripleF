import { Global, Module } from '@nestjs/common';

import { OllamaOverridesController } from './controllers/ollama-overrides.controller.js';
import { ModelWarmupService } from './services/model-warmup.service.js';
import { OllamaOverridesService } from './services/ollama-overrides.service.js';

/**
 * App-side Ollama wiring: Settings connection overrides and model warm-up.
 * The Ollama API client itself (model catalog, capability/origin
 * resolution, provider-client factory) lives in `@triplef/ollama-api` and
 * is registered via `OllamaApiModule.registerAsync` in MainModule.
 */
@Global()
@Module({
  controllers: [OllamaOverridesController],
  providers: [OllamaOverridesService, ModelWarmupService],
  exports: [OllamaOverridesService, ModelWarmupService],
})
export class OllamaModule {}
