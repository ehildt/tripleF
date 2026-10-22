import { DynamicModule, Module } from '@nestjs/common';

import { MemoryTaxonomyModule } from '../memory-taxonomy/memory-taxonomy.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

import { MemoryPartitionController } from './controllers/memory-partition.controller.js';
import { MemoryPartitionMaintenanceController } from './controllers/memory-partition-maintenance.controller.js';
import { ConsolidationAdjudicatorService } from './services/consolidation-adjudicator.service.js';
import { FrictionAdjudicatorService } from './services/friction-adjudicator.service.js';
import { MemorySearchService } from './services/memory-search.service.js';
import { VectorizeService } from './services/vectorize.service.js';
import { MemoryClusterJobService } from './services/vectorize/jobs/memory-cluster-job.service.js';
import { MemoryConsolidateJobService } from './services/vectorize/jobs/memory-consolidate-job.service.js';
import { MemoryReflectService } from './services/vectorize/jobs/memory-reflect.service.js';
import { MemoryRelinkJobService } from './services/vectorize/jobs/memory-relink-job.service.js';
import { EmbedStepService } from './services/vectorize/steps/embed-step.service.js';
import { ExtractStepService } from './services/vectorize/steps/extract-step.service.js';
import { StoreStepService } from './services/vectorize/steps/store-step.service.js';
import { VectorizeStepEngineService } from './services/vectorize/vectorize-step-engine.service.js';
import { VectorizeStepRegistryService } from './services/vectorize/vectorize-step-registry.service.js';

const LANE_PROVIDERS = [
  MemorySearchService,
  VectorizeService,
  ConsolidationAdjudicatorService,
  FrictionAdjudicatorService,
  VectorizeStepEngineService,
  VectorizeStepRegistryService,
  ExtractStepService,
  EmbedStepService,
  StoreStepService,
  MemoryConsolidateJobService,
  MemoryRelinkJobService,
  MemoryReflectService,
  MemoryClusterJobService,
];

/**
 * The fact/episodic partition lane: read/write + maintenance controllers, the
 * multi-variant search service, the vectorize step machine, and the partition
 * sweep jobs. The shared `DELETE /memory/text` route and the profile job
 * live in the cognition lane, which imports this module for search and
 * store services — the lane graph is strictly layered.
 */
@Module({})
export class MemoryPartitionModule {
  private static readonly registration: DynamicModule = {
    module: MemoryPartitionModule,
    controllers: [
      MemoryPartitionController,
      MemoryPartitionMaintenanceController,
    ],
    exports: [...LANE_PROVIDERS],
    imports: [PersistenceModule.register(), MemoryTaxonomyModule.register()],
    providers: LANE_PROVIDERS,
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return MemoryPartitionModule.registration;
  }
}
