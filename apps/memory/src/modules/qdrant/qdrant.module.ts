import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { EncyclopediaModule } from '../encyclopedia/encyclopedia.module.js';
import { OllamaModule } from '../ollama/ollama.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { ResearchModule } from '../research/research.module.js';

import { QDRANT_CONFIG } from './constants/qdrant.constants.js';
import { MemoryOverridesController } from './controllers/memory-overrides.controller.js';
import { MemoryStatusController } from './controllers/status.controller.js';
import type { QdrantModuleProps } from './models/qdrant-module.model.js';
import { EmbeddingService } from './services/embedding.service.js';
import { EncyclopediaRepository } from './services/encyclopedia.repository.js';
import { MemoryClusterPointRepository } from './services/memory-cluster-point.repository.js';
import { MemoryEnqueueService } from './services/memory-enqueue.service.js';
import { MemoryGraphRepository } from './services/memory-graph.repository.js';
import { MemoryLabelRepository } from './services/memory-label.repository.js';
import { MemoryOverridesService } from './services/memory-overrides.service.js';
import { MemoryRecordRepository } from './services/memory-record.repository.js';
import { MemoryReflectionRepository } from './services/memory-reflection.repository.js';
import { MemorySynthesisRepository } from './services/memory-synthesis.repository.js';
import { QdrantClientService } from './services/qdrant-client.service.js';
import { QdrantHealthIndicator } from './services/qdrant-health-indicator.service.js';
import { SynopsisRepository } from './services/synopsis.repository.js';
import { TaxonomyVectorRepository } from './services/taxonomy-vector.repository.js';

/**
 * Qdrant storage infra: the client connection, the embedding client, the
 * collection repositories, and the cross-lane enqueue/overrides services.
 * The memory lanes (partition, cognition, taxonomy, encyclopedia) own their
 * domain services/controllers/jobs in their own feature modules.
 *
 * Import edges: persistence (shared Postgres tables) and encyclopedia — the
 * encyclopedia repository needs `ENCYCLOPEDIA_CONFIG`, and the lane modules
 * consume this module's exports through the global scope (no reverse edge).
 */
@Module({})
export class QdrantModule {
  static registerAsync(options: QdrantModuleProps): DynamicModule {
    return {
      module: QdrantModule,
      global: options.global,
      controllers: [MemoryStatusController, MemoryOverridesController],
      providers: [
        {
          provide: QDRANT_CONFIG,
          inject: options.inject,
          useFactory: options.useFactory,
        },
        QdrantClientService,
        MemoryClusterPointRepository,
        MemoryGraphRepository,
        MemoryLabelRepository,
        MemoryRecordRepository,
        MemoryReflectionRepository,
        MemorySynthesisRepository,
        EncyclopediaRepository,
        SynopsisRepository,
        EmbeddingService,
        TaxonomyVectorRepository,
        MemoryOverridesService,
        MemoryEnqueueService,
        QdrantHealthIndicator,
      ],
      exports: [
        QDRANT_CONFIG,
        QdrantClientService,
        MemoryClusterPointRepository,
        MemoryGraphRepository,
        MemoryLabelRepository,
        MemoryRecordRepository,
        MemoryReflectionRepository,
        MemorySynthesisRepository,
        EncyclopediaRepository,
        SynopsisRepository,
        EmbeddingService,
        TaxonomyVectorRepository,
        MemoryOverridesService,
        MemoryEnqueueService,
        QdrantHealthIndicator,
      ],
      imports: [
        TerminusModule.forRoot({ errorLogStyle: 'pretty' }),
        PersistenceModule.register(),
        EncyclopediaModule.register(),
        OllamaModule.register(),
        ResearchModule.register(),
        ...(options.imports ?? []),
      ],
    };
  }
}
