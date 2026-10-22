import { DynamicModule, Module } from '@nestjs/common';

import { MemoryPartitionModule } from '../memory-partition/memory-partition.module.js';
import { MemoryTaxonomyModule } from '../memory-taxonomy/memory-taxonomy.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

import { MemoryCognitionController } from './controllers/memory-cognition.controller.js';
import { MemoryCognitionMaintenanceController } from './controllers/memory-cognition-maintenance.controller.js';
import { MemoryCognitionService } from './services/memory-cognition.service.js';
import { MemoryConvictionService } from './services/memory-conviction.service.js';
import { MemoryProfileJobService } from './services/memory-profile-job.service.js';

/**
 * The cognition lane: the profile snapshot/insight/conviction read-write
 * surface (including the shared `DELETE /memory/text` route, whose partition
 * branch delegates to the partition lane), the profile/conviction/write
 * jobs, and the cognition service. Imports the partition lane for its search
 * and store services — one-way; nothing in the partition lane imports back.
 */
@Module({})
export class MemoryCognitionModule {
  private static readonly registration: DynamicModule = {
    module: MemoryCognitionModule,
    controllers: [
      MemoryCognitionController,
      MemoryCognitionMaintenanceController,
    ],
    exports: [
      MemoryCognitionService,
      MemoryProfileJobService,
      MemoryConvictionService,
    ],
    imports: [
      PersistenceModule.register(),
      MemoryPartitionModule.register(),
      MemoryTaxonomyModule.register(),
    ],
    providers: [
      MemoryCognitionService,
      MemoryProfileJobService,
      MemoryConvictionService,
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return MemoryCognitionModule.registration;
  }
}
