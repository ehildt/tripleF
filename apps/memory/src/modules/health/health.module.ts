import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { OllamaModule } from '../ollama/ollama.module.js';

import { HealthController } from './controllers/health.controller.js';
import { HealthService } from './services/health.service.js';

/**
 * Readiness surface: Terminus wiring plus the health service/controller.
 * The Qdrant indicator the service probes is provided by the global qdrant
 * module; the Ollama override config comes through an explicit import.
 *
 * Per-site Terminus registration: the factory stamps a fresh indicator
 * scope per importing module — with only HealthModule importing it, this
 * behaves as a single global health stack while keeping the registration
 * local to its consumer.
 */
@Module({})
export class HealthModule {
  private static readonly registration: DynamicModule = {
    module: HealthModule,
    controllers: [HealthController],
    imports: [
      TerminusModule.forRoot({ errorLogStyle: 'pretty' }),
      OllamaModule.register(),
    ],
    providers: [HealthService],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return HealthModule.registration;
  }
}
