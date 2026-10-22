import { DynamicModule, Module } from '@nestjs/common';

import { PostgresModule } from '../postgres/postgres.module.js';

import { LifecycleService } from './services/lifecycle.service.js';
import { DeadLetterRepository } from './services/repository.service.js';

/**
 * Dead-letter pipeline for the vectorize queue: permanent and max-attempts
 * failures are recorded in the shared `dead_letter_job` table (the main
 * server's DLQ UI reads the same table, so vectorize failures stay visible
 * there). Lifecycle is generic over queues; only the harness-specific
 * markApplicationFailure path is server-side.
 */
@Module({})
export class DeadLetterModule {
  private static readonly registration: DynamicModule = {
    module: DeadLetterModule,
    exports: [LifecycleService, DeadLetterRepository],
    imports: [PostgresModule.register()],
    providers: [LifecycleService, DeadLetterRepository],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return DeadLetterModule.registration;
  }
}
