import { DynamicModule, Module } from '@nestjs/common';

import { OLLAMA_API_CONFIG } from './ollama-api.constants.ts';
import { OllamaApiModuleProps } from './ollama-api.model.ts';
import { OllamaApiService } from './ollama-api.service.ts';

/**
 * Dynamic module for registering the Ollama API client. Use
 * `registerAsync()` to supply the `OllamaApiConfig` via a factory (the
 * env-driven config and live overrides live in the consuming app, not in
 * this library).
 */
@Module({})
export class OllamaApiModule {
  /** Registers the module asynchronously with the Ollama API config. */
  static registerAsync(options: OllamaApiModuleProps): DynamicModule {
    const configProvider = {
      provide: OLLAMA_API_CONFIG,
      inject: options.inject,
      useFactory: options.useFactory,
    };
    return {
      global: options.global,
      module: OllamaApiModule,
      exports: [OLLAMA_API_CONFIG, OllamaApiService],
      providers: [configProvider, OllamaApiService],
    };
  }
}
