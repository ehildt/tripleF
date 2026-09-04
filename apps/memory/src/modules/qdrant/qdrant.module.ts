import { DynamicModule, Module } from '@nestjs/common';

import { QDRANT_CONFIG } from './constants/qdrant.constants.js';
import { MemoryCognitionMaintenanceController } from './controllers/memory-cognition-maintenance.controller.js';
import { MemoryOverridesController } from './controllers/memory-overrides.controller.js';
import { MemoryPartitionMaintenanceController } from './controllers/memory-partition-maintenance.controller.js';
import { QdrantController } from './controllers/qdrant.controller.js';
import type { QdrantModuleProps } from './models/qdrant-module.model.js';
import { ConsolidationAdjudicatorService } from './services/consolidation-adjudicator.service.js';
import { EmbeddingService } from './services/embedding.service.js';
import { EncyclopediaRepository } from './services/encyclopedia.repository.js';
import { FrictionAdjudicatorService } from './services/friction-adjudicator.service.js';
import { MemoryRepository } from './services/memory.repository.js';
import { MemoryCognitionService } from './services/memory-cognition.service.js';
import { MemoryEnqueueService } from './services/memory-enqueue.service.js';
import { MemoryOverridesService } from './services/memory-overrides.service.js';
import { MemorySearchService } from './services/memory-search.service.js';
import { QdrantClientService } from './services/qdrant-client.service.js';
import { SynopsisRepository } from './services/synopsis.repository.js';
import { VectorizeService } from './services/vectorize.service.js';
import { EncyclopediaClassifyService } from './services/vectorize/jobs/encyclopedia-classify.service.js';
import { EncyclopediaSweepService } from './services/vectorize/jobs/encyclopedia-sweep.service.js';
import { MemoryClusterJobService } from './services/vectorize/jobs/memory-cluster-job.service.js';
import { MemoryConsolidateJobService } from './services/vectorize/jobs/memory-consolidate-job.service.js';
import { MemoryConvictionService } from './services/vectorize/jobs/memory-conviction.service.js';
import { MemoryProfileJobService } from './services/vectorize/jobs/memory-profile-job.service.js';
import { MemoryReflectService } from './services/vectorize/jobs/memory-reflect.service.js';
import { MemoryRelinkJobService } from './services/vectorize/jobs/memory-relink-job.service.js';
import { MemoryWriteJobService } from './services/vectorize/jobs/memory-write-job.service.js';
import { EmbedStepService } from './services/vectorize/steps/embed-step.service.js';
import { ExtractStepService } from './services/vectorize/steps/extract-step.service.js';
import { StoreStepService } from './services/vectorize/steps/store-step.service.js';
import { VectorizeStepEngineService } from './services/vectorize/vectorize-step-engine.service.js';
import { VectorizeStepRegistryService } from './services/vectorize/vectorize-step-registry.service.js';

@Module({})
export class QdrantModule {
  static registerAsync(options: QdrantModuleProps): DynamicModule {
    return {
      module: QdrantModule,
      global: options.global,
      controllers: [
        QdrantController,
        MemoryPartitionMaintenanceController,
        MemoryCognitionMaintenanceController,
        MemoryOverridesController,
      ],
      providers: [
        {
          provide: QDRANT_CONFIG,
          inject: options.inject,
          useFactory: options.useFactory,
        },
        QdrantClientService,
        MemoryRepository,
        EncyclopediaRepository,
        SynopsisRepository,
        MemorySearchService,
        EmbeddingService,
        VectorizeService,
        MemoryCognitionService,
        MemoryOverridesService,
        MemoryEnqueueService,
        // Shared LLM adjudication (consolidate + relink verdicts).
        ConsolidationAdjudicatorService,
        // Shared LLM adjudication for the reflection pass's friction screen.
        FrictionAdjudicatorService,
        // Vectorize pipeline step machine (mirrors the harness step registry).
        VectorizeStepEngineService,
        VectorizeStepRegistryService,
        ExtractStepService,
        EmbedStepService,
        StoreStepService,
        // Cognition write jobs (memory-write / memory-profile handlers).
        MemoryWriteJobService,
        MemoryProfileJobService,
        // Consolidation sweep job (memory-consolidate handler).
        MemoryConsolidateJobService,
        // Relink sweep job (memory-relink handler).
        MemoryRelinkJobService,
        // Reflection sweep job (memory-reflect handler).
        MemoryReflectService,
        // Conviction-synthesis job (memory-conviction handler).
        MemoryConvictionService,
        // Cluster-detection + summarization job (memory-cluster handler).
        MemoryClusterJobService,
        // Encyclopedia supersede sweep job (encyclopedia-consolidate handler).
        EncyclopediaSweepService,
        // Encyclopedia classification job (encyclopedia-classify handler).
        EncyclopediaClassifyService,
      ],
      exports: [
        QDRANT_CONFIG,
        QdrantClientService,
        MemoryRepository,
        EncyclopediaRepository,
        SynopsisRepository,
        MemorySearchService,
        VectorizeService,
        MemoryCognitionService,
        MemoryOverridesService,
        MemoryEnqueueService,
        EmbeddingService,
        // Vectorize processor deps (the processor is registered under
        // BullMQModule, so its constructor deps must be globally exported).
        VectorizeStepEngineService,
        VectorizeStepRegistryService,
        ExtractStepService,
        EmbedStepService,
        StoreStepService,
        MemoryWriteJobService,
        MemoryProfileJobService,
        MemoryConsolidateJobService,
        MemoryRelinkJobService,
        MemoryReflectService,
        MemoryConvictionService,
        MemoryClusterJobService,
        EncyclopediaSweepService,
        EncyclopediaClassifyService,
      ],
      imports: options.imports,
    };
  }
}
