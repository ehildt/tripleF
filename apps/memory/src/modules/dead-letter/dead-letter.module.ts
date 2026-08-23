import { Global, Module } from '@nestjs/common';

import { LifecycleService } from './services/lifecycle.service.js';
import { DeadLetterRepository } from './services/repository.service.js';

/**
 * Dead-letter pipeline for the vectorize queue: permanent and max-attempts
 * failures are recorded in the shared `dead_letter_job` table (the main
 * server's DLQ UI reads the same table, so vectorize failures stay visible
 * there). Lifecycle is generic over queues; only the harness-specific
 * markApplicationFailure path is server-side.
 */
@Global()
@Module({
  providers: [LifecycleService, DeadLetterRepository],
  exports: [LifecycleService, DeadLetterRepository],
})
export class DeadLetterModule {}
