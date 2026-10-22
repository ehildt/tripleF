import { DynamicModule, Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence/persistence.module.js';
import { SecretsModule } from '../secrets/secrets.module.js';

import { OllamaConfigService } from './configs/ollama-config.service.js';
import { OllamaOverridesController } from './controllers/ollama-overrides.controller.js';
import { ModelWarmupService } from './services/model-warmup.service.js';
import { OllamaOverridesService } from './services/ollama-overrides.service.js';

/**
 * App-side Ollama wiring: Settings connection overrides and model warm-up.
 * The Ollama API client itself (model catalog, capability/origin
 * resolution, provider-client factory) lives in `@triplef/ollama-api` and
 * is registered via `OllamaApiModule.registerAsync` in MainModule, which
 * imports this module so the factory can inject the (non-global) overrides
 * service.
 */
@Module({})
export class OllamaModule {
  private static readonly registration: DynamicModule = {
    module: OllamaModule,
    controllers: [OllamaOverridesController],
    exports: [OllamaConfigService, OllamaOverridesService, ModelWarmupService],
    imports: [PersistenceModule.register(), SecretsModule.register()],
    providers: [
      OllamaConfigService,
      OllamaOverridesService,
      ModelWarmupService,
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return OllamaModule.registration;
  }
}
