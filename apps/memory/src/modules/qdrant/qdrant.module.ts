import { DynamicModule, Module } from '@nestjs/common';

import { QDRANT_CONFIG } from './constants/qdrant.constants.js';
import { MemoryOverridesController } from './controllers/memory-overrides.controller.js';
import { MemoryStatusController } from './controllers/status.controller.js';
import type { QdrantModuleProps } from './models/qdrant-module.model.js';
import { EmbeddingService } from './services/embedding.service.js';
import { EncyclopediaRepository } from './services/encyclopedia.repository.js';
import { MemoryRepository } from './services/memory.repository.js';
import { MemoryEnqueueService } from './services/memory-enqueue.service.js';
import { MemoryOverridesService } from './services/memory-overrides.service.js';
import { QdrantClientService } from './services/qdrant-client.service.js';
import { SynopsisRepository } from './services/synopsis.repository.js';
import { TaxonomyVectorRepository } from './services/taxonomy-vector.repository.js';

/**
 * Qdrant storage infra: the client connection, the embedding client, the
 * collection repositories, and the cross-lane enqueue/overrides services.
 * The memory lanes (partition, cognition, taxonomy, encyclopedia) own their
 * domain services/controllers/jobs in their own feature modules.
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
        MemoryRepository,
        EncyclopediaRepository,
        SynopsisRepository,
        EmbeddingService,
        TaxonomyVectorRepository,
        MemoryOverridesService,
        MemoryEnqueueService,
      ],
      exports: [
        QDRANT_CONFIG,
        QdrantClientService,
        MemoryRepository,
        EncyclopediaRepository,
        SynopsisRepository,
        EmbeddingService,
        TaxonomyVectorRepository,
        MemoryOverridesService,
        MemoryEnqueueService,
      ],
      imports: options.imports,
    };
  }
}
