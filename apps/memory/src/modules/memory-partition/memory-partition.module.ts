import { Global, Module } from '@nestjs/common';

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
import { MemoryWriteJobService } from './services/vectorize/jobs/memory-write-job.service.js';
import { EmbedStepService } from './services/vectorize/steps/embed-step.service.js';
import { ExtractStepService } from './services/vectorize/steps/extract-step.service.js';
import { StoreStepService } from './services/vectorize/steps/store-step.service.js';
import { VectorizeStepEngineService } from './services/vectorize/vectorize-step-engine.service.js';
import { VectorizeStepRegistryService } from './services/vectorize/vectorize-step-registry.service.js';

/**
 * The fact/episodic partition lane: read/write + maintenance controllers, the
 * multi-variant search service, the vectorize step machine, and the partition
 * sweep jobs. Global so the BullMQ-registered vectorize processor can inject
 * the job/step services without importing this module.
 */
@Global()
@Module({
  controllers: [
    MemoryPartitionController,
    MemoryPartitionMaintenanceController,
  ],
  providers: [
    MemorySearchService,
    VectorizeService,
    ConsolidationAdjudicatorService,
    FrictionAdjudicatorService,
    VectorizeStepEngineService,
    VectorizeStepRegistryService,
    ExtractStepService,
    EmbedStepService,
    StoreStepService,
    MemoryWriteJobService,
    MemoryConsolidateJobService,
    MemoryRelinkJobService,
    MemoryReflectService,
    MemoryClusterJobService,
  ],
  exports: [
    MemorySearchService,
    VectorizeService,
    ConsolidationAdjudicatorService,
    FrictionAdjudicatorService,
    VectorizeStepEngineService,
    VectorizeStepRegistryService,
    ExtractStepService,
    EmbedStepService,
    StoreStepService,
    MemoryWriteJobService,
    MemoryConsolidateJobService,
    MemoryRelinkJobService,
    MemoryReflectService,
    MemoryClusterJobService,
  ],
})
export class MemoryPartitionModule {}
