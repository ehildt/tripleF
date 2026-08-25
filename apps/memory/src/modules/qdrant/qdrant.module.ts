import { DynamicModule, Module } from '@nestjs/common';

import { QDRANT_CONFIG } from './constants/qdrant.constants.js';
import { MemoryOverridesController } from './controllers/memory-overrides.controller.js';
import { QdrantController } from './controllers/qdrant.controller.js';
import type { QdrantModuleProps } from './models/qdrant-module.model.js';
import { EmbeddingService } from './services/embedding.service.js';
import { MemoryRepository } from './services/memory.repository.js';
import { MemoryCognitionService } from './services/memory-cognition.service.js';
import { MemoryEnqueueService } from './services/memory-enqueue.service.js';
import { MemoryOverridesService } from './services/memory-overrides.service.js';
import { MemorySearchService } from './services/memory-search.service.js';
import { QdrantClientService } from './services/qdrant-client.service.js';
import { VectorizeService } from './services/vectorize.service.js';
import { MemoryConsolidateJobService } from './services/vectorize/jobs/memory-consolidate-job.service.js';
import { MemoryProfileJobService } from './services/vectorize/jobs/memory-profile-job.service.js';
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
      controllers: [QdrantController, MemoryOverridesController],
      providers: [
        {
          provide: QDRANT_CONFIG,
          inject: options.inject,
          useFactory: options.useFactory,
        },
        QdrantClientService,
        MemoryRepository,
        MemorySearchService,
        EmbeddingService,
        VectorizeService,
        MemoryCognitionService,
        MemoryOverridesService,
        MemoryEnqueueService,
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
      ],
      exports: [
        QDRANT_CONFIG,
        QdrantClientService,
        MemoryRepository,
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
      ],
      imports: options.imports,
    };
  }
}
