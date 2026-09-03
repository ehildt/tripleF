import { Global, Module } from '@nestjs/common';

import { OllamaOverridesService } from './services/ollama-overrides.service.js';

/**
 * App-side Ollama wiring for the memory app: SysCtl connection overrides.
 * The Ollama API client itself (model catalog, capability/origin
 * resolution, provider-client factory) lives in `@triplef/ollama-api` and
 * is registered via `OllamaApiModule.registerAsync` in MemoryModule.
 */
@Global()
@Module({
  providers: [OllamaOverridesService],
  exports: [OllamaOverridesService],
})
export class OllamaModule {}
