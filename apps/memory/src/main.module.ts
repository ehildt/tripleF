import { Logger, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { type AiSdkConfig, AiSdkModule } from '@triplef/ai-sdk';
import { BullMQModule } from '@triplef/bullmq';
import { BullMQLoggerModule } from '@triplef/bullmq-logger';
import { ConfigFactoryModule } from '@triplef/config-factory';
import { CoreLoggerModule } from '@triplef/core-logger';
import { OllamaApiModule, OllamaApiService } from '@triplef/ollama-api';

import { AppConfigService } from './configs/app-config.service.js';
import { BullMQConfigService } from './modules/bullmq/configs/bullmq-config.service.js';
import { BullMQLoggerConfigService } from './modules/bullmq/configs/bullmq-logger-config.service.js';
import { VECTORIZE_QUEUE } from './modules/bullmq/constants/bullmq.constants.js';
import { VectorizeProcessor } from './modules/bullmq/processors/vectorize.processor.js';
import { CoreLoggerConfigService } from './modules/core-logger/configs/core-logger-config.service.js';
import { DeadLetterModule } from './modules/dead-letter/dead-letter.module.js';
import { EncyclopediaConfigService } from './modules/encyclopedia/configs/encyclopedia-config.service.js';
import { EncyclopediaModule } from './modules/encyclopedia/encyclopedia.module.js';
import { HealthController } from './modules/health/controllers/health.controller.js';
import { HealthService } from './modules/health/services/health.service.js';
import { MemoryCognitionModule } from './modules/memory-cognition/memory-cognition.module.js';
import { MemoryPartitionModule } from './modules/memory-partition/memory-partition.module.js';
import { MemoryTaxonomyModule } from './modules/memory-taxonomy/memory-taxonomy.module.js';
import { OllamaConfigService } from './modules/ollama/configs/ollama-config.service.js';
import { OllamaModule } from './modules/ollama/ollama.module.js';
import { OllamaOverridesService } from './modules/ollama/services/ollama-overrides.service.js';
import { PersistenceModule } from './modules/persistence/persistence.module.js';
import { QdrantConfigService } from './modules/qdrant/configs/qdrant-config.service.js';
import { QdrantModule } from './modules/qdrant/qdrant.module.js';
import { QdrantHealthIndicator } from './modules/qdrant/services/qdrant-health-indicator.service.js';
import { ResearchConfigService } from './modules/research/configs/research-config.service.js';
import { ResearchModule } from './modules/research/research.module.js';
import { SecretsModule } from './modules/secrets/secrets.module.js';

/**
 * Memory app root module: Qdrant storage + the vectorize pipeline
 * (embed/extract/store) driven by the shared BullMQ `vectorize` queue.
 * The main server enqueues jobs here; this process runs the worker and
 * exposes the read/write REST surface under /api/v1/memory* and
 * /api/v1/encyclopedia*.
 */
@Module({
  controllers: [HealthController],
  providers: [Logger, HealthService, QdrantHealthIndicator],
  imports: [
    BullMQModule,
    OllamaModule,
    OllamaApiModule.registerAsync({
      global: true,
      inject: [OllamaOverridesService],
      useFactory: (overrides: OllamaOverridesService) => ({
        resolveConnection: () => overrides.getConfig(),
        // The catalog changes rarely in production; elsewhere keep it
        // effectively uncached so newly pulled models appear immediately.
        modelsCacheTtlMs: process.env.NODE_ENV === 'production' ? 300_000 : 1,
        // The memory app has no models endpoint that warms the catalog
        // lazily — refresh it periodically instead.
        refreshIntervalMs: 60_000,
      }),
    }),
    AiSdkModule.registerAsync({
      global: true,
      inject: [OllamaConfigService, OllamaApiService],
      useFactory: (
        cfg: OllamaConfigService,
        ollama: OllamaApiService,
      ): AiSdkConfig => ({
        streamChunkTimeoutMs: cfg.config.streamChunkTimeoutMs,
        streamTotalTimeoutMs: cfg.config.streamTotalTimeoutMs,
        generateTotalTimeoutMs: cfg.config.generateTotalTimeoutMs,
        enableSmoothStream: cfg.config.enableSmoothStream,
        createModel: (name) => ollama.createModel(name),
      }),
    }),
    PersistenceModule,
    SecretsModule,
    DeadLetterModule,
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
    ConfigFactoryModule.forRoot({
      global: true,
      providers: [
        AppConfigService,
        QdrantConfigService,
        EncyclopediaConfigService,
        OllamaConfigService,
        BullMQConfigService,
        BullMQLoggerConfigService,
        CoreLoggerConfigService,
        ResearchConfigService,
      ],
    }),
    CoreLoggerModule.registerAsync({
      global: true,
      inject: [CoreLoggerConfigService],
      useFactory: ({ config }: CoreLoggerConfigService) => config,
    }),
    BullMQLoggerModule.registerAsync({
      global: true,
      inject: [BullMQLoggerConfigService],
      useFactory: async ({ config }: BullMQLoggerConfigService) => config,
    }),
    BullMQModule.registerAsync({
      global: true,
      inject: [BullMQConfigService],
      useFactory: async ({ config }: BullMQConfigService) => config,
      processors: [VectorizeProcessor],
      queues: [VECTORIZE_QUEUE],
    }),
    QdrantModule.registerAsync({
      global: true,
      inject: [QdrantConfigService],
      useFactory: async ({ config }: QdrantConfigService) => config,
    }),
    EncyclopediaModule,
    MemoryPartitionModule,
    MemoryCognitionModule,
    MemoryTaxonomyModule,
    ResearchModule,
  ],
})
export class MemoryModule {}
