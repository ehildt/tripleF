import { Logger, Module } from '@nestjs/common';
import { type AiSdkConfig, AiSdkModule } from '@triplef/ai-sdk';
import { ConfigFactoryModule } from '@triplef/config-factory';
import { OllamaApiModule, OllamaApiService } from '@triplef/ollama-api';

import { AppConfigService } from './configs/app-config.service.js';
import { BullMQModule } from './modules/bullmq/bullmq.module.js';
import { BullMQConfigService } from './modules/bullmq/configs/bullmq-config.service.js';
import { BullMQLoggerConfigService } from './modules/bullmq/configs/bullmq-logger-config.service.js';
import { CoreLoggerConfigService } from './modules/core-logger/configs/core-logger-config.service.js';
import { CoreLoggerModule } from './modules/core-logger/core-logger.module.js';
import { EncyclopediaConfigService } from './modules/encyclopedia/configs/encyclopedia-config.service.js';
import { EncyclopediaModule } from './modules/encyclopedia/encyclopedia.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MemoryCognitionModule } from './modules/memory-cognition/memory-cognition.module.js';
import { MemoryPartitionModule } from './modules/memory-partition/memory-partition.module.js';
import { MemoryTaxonomyModule } from './modules/memory-taxonomy/memory-taxonomy.module.js';
import { OllamaConfigService } from './modules/ollama/configs/ollama-config.service.js';
import { OllamaModule } from './modules/ollama/ollama.module.js';
import { OllamaOverridesService } from './modules/ollama/services/ollama-overrides.service.js';
import { QdrantConfigService } from './modules/qdrant/configs/qdrant-config.service.js';
import { QdrantModule } from './modules/qdrant/qdrant.module.js';
import { ResearchConfigService } from './modules/research/configs/research-config.service.js';
import { ResearchModule } from './modules/research/research.module.js';

/**
 * Memory app composition root: the global env-config registry, the shared
 * connection-class registrations (qdrant storage, the Ollama API client,
 * the AI SDK), and one `register()` call per feature module. Controllers,
 * services, and indicators live in their feature modules.
 *
 * Qdrant storage + the vectorize pipeline (embed/extract/store) are driven
 * by the shared BullMQ `vectorize` queue. The main server enqueues jobs
 * here; this process runs the worker and exposes the read/write REST
 * surface under /api/v1/memory* and /api/v1/encyclopedia*.
 */
@Module({
  imports: [
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
    QdrantModule.registerAsync({
      global: true,
      inject: [QdrantConfigService],
      useFactory: async ({ config }: QdrantConfigService) => config,
    }),
    OllamaApiModule.registerAsync({
      global: true,
      imports: [OllamaModule.register()],
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
    CoreLoggerModule.register(),
    BullMQModule.register(),
    MemoryTaxonomyModule.register(),
    MemoryCognitionModule.register(),
    MemoryPartitionModule.register(),
    EncyclopediaModule.register(),
    ResearchModule.register(),
    HealthModule.register(),
  ],
  providers: [Logger],
})
export class MemoryModule {}
