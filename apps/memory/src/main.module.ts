import { BullMQModule } from '@ehildt/nestjs-bullmq';
import { BullMQLoggerModule } from '@ehildt/nestjs-bullmq-logger';
import { Logger, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigFactoryModule } from '@triplef/config-factory';

import { AppConfigService } from './configs/app-config.service.js';
import { AiSdkModule } from './modules/ai-sdk/ai-sdk.module.js';
import { OllamaConfigService } from './modules/ai-sdk/configs/ollama-config.service.js';
import { BullMQConfigService } from './modules/bullmq/configs/bullmq-config.service.js';
import { BullMQLoggerConfigService } from './modules/bullmq/configs/bullmq-logger-config.service.js';
import { VECTORIZE_QUEUE } from './modules/bullmq/constants/bullmq.constants.js';
import { DeadLetterModule } from './modules/dead-letter/dead-letter.module.js';
import { HealthController } from './modules/health/controllers/health.controller.js';
import { HealthService } from './modules/health/services/health.service.js';
import { PersistenceModule } from './modules/persistence/persistence.module.js';
import { PinoLoggerConfigService } from './modules/pino-logger/configs/pino-logger-config.service.js';
import { PinoLoggerModule } from './modules/pino-logger/pino-logger.module.js';
import { QdrantConfigService } from './modules/qdrant/configs/qdrant-config.service.js';
import { VectorizeProcessor } from './modules/qdrant/processors/vectorize.processor.js';
import { QdrantModule } from './modules/qdrant/qdrant.module.js';
import { QdrantHealthIndicator } from './modules/qdrant/services/qdrant-health-indicator.service.js';
import { SecretsModule } from './modules/secrets/secrets.module.js';

/**
 * Memory app root module: Qdrant storage + the vectorize pipeline
 * (embed/extract/store) driven by the shared BullMQ `vectorize` queue.
 * The main server enqueues jobs here; this process runs the worker and
 * exposes the read/write REST surface under /api/v1/qdrant*.
 */
@Module({
  controllers: [HealthController],
  providers: [Logger, HealthService, QdrantHealthIndicator],
  imports: [
    PinoLoggerModule,
    BullMQModule,
    AiSdkModule,
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
        OllamaConfigService,
        BullMQConfigService,
        BullMQLoggerConfigService,
        PinoLoggerConfigService,
      ],
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
  ],
})
export class MemoryModule {}
