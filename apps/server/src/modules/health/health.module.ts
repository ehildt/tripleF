import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { DeadLetterModule } from '../dead-letter/dead-letter.module.js';
import { MemoryClientModule } from '../memory-client/memory-client.module.js';
import { ObjectStorageModule } from '../object-storage/object-storage.module.js';
import { OllamaModule } from '../ollama/ollama.module.js';

import { HealthController } from './controllers/health.controller.js';
import { HealthService } from './services/health.service.js';
import { PostgresHealthIndicator } from './services/postgres-health-indicator.service.js';

/**
 * Readiness/liveness probes aggregating the per-infra health indicators
 * (disk, heap, ollama, postgres, object storage, memory app). TerminusModule is not
 * global, so it is imported here for the module's own indicators; the
 * sibling indicators come from their owning feature modules.
 */
@Module({})
export class HealthModule {
  private static readonly registration: DynamicModule = {
    module: HealthModule,
    controllers: [HealthController],
    imports: [
      HttpModule,
      TerminusModule.forRoot({ errorLogStyle: 'pretty' }),
      DeadLetterModule.register(),
      MemoryClientModule.register(),
      ObjectStorageModule.register(),
      OllamaModule.register(),
    ],
    providers: [HealthService, PostgresHealthIndicator],
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
