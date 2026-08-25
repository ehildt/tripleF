import { DynamicModule, Module } from '@nestjs/common';

import { AI_SDK_CONFIG } from './ai-sdk.constants.ts';
import { AiSdkModuleProps } from './ai-sdk.model.ts';
import { AiSdkService } from './ai-sdk.service.ts';

/**
 * Dynamic module for registering the AI SDK services with an Ollama
 * connection config. Use `registerAsync()` to supply the `AiSdkConfig`
 * via a factory (the env-driven config lives in the consuming app, not in
 * this library).
 */
@Module({})
export class AiSdkModule {
  /** Registers the module asynchronously with the AI SDK config. */
  static registerAsync(options: AiSdkModuleProps): DynamicModule {
    const configProvider = {
      provide: AI_SDK_CONFIG,
      inject: options.inject,
      useFactory: options.useFactory,
    };
    return {
      global: options.global,
      module: AiSdkModule,
      exports: [AI_SDK_CONFIG, AiSdkService],
      providers: [configProvider, AiSdkService],
    };
  }
}
