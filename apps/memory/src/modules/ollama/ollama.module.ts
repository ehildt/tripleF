import { DynamicModule, Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence/persistence.module.js';
import { SecretsModule } from '../secrets/secrets.module.js';

import { OllamaOverridesService } from './services/ollama-overrides.service.js';

/**
 * App-side Ollama wiring for the memory app: Settings connection overrides
 * (persisted via the shared overrides table, decrypted with the secrets
 * cipher). The Ollama API client itself (model catalog, capability/origin
 * resolution, provider-client factory) lives in `@triplef/ollama-api` and is
 * registered via `OllamaApiModule.registerAsync` in MemoryModule.
 */
@Module({})
export class OllamaModule {
  private static readonly registration: DynamicModule = {
    module: OllamaModule,
    exports: [OllamaOverridesService],
    imports: [PersistenceModule.register(), SecretsModule.register()],
    providers: [OllamaOverridesService],
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
