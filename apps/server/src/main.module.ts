import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { type AiSdkConfig, AiSdkModule } from '@triplef/ai-sdk';
import { BullMQModule } from '@triplef/bullmq';
import { BullMQLoggerModule } from '@triplef/bullmq-logger';
import { ConfigFactoryModule } from '@triplef/config-factory';
import { CoreLoggerModule } from '@triplef/core-logger';
import { OllamaApiModule, OllamaApiService } from '@triplef/ollama-api';
import { SocketIOModule as SocketIOCoreModule } from '@triplef/socketio';

import { AppConfigService } from './configs/app-config.service.js';
import { BullMQConfigService } from './modules/bullmq/configs/bullmq-config.service.js';
import { BullMQLoggerConfigService } from './modules/bullmq/configs/bullmq-logger-config.service.js';
import {
  HARNESS_QUEUE,
  VECTORIZE_QUEUE,
} from './modules/bullmq/constants/bullmq.constants.js';
import { BullMQController } from './modules/bullmq/controllers/bullmq.controller.js';
import { CoreLoggerConfigService } from './modules/core-logger/configs/core-logger-config.service.js';
import { PostgresConfigService } from './modules/dead-letter/configs/postgres-config.service.js';
import { DeadLetterController } from './modules/dead-letter/controllers/dead-letter.controller.js';
import { DeadLetterModule } from './modules/dead-letter/dead-letter.module.js';
import { LifecycleService } from './modules/dead-letter/services/lifecycle.service.js';
import { NumCtxConfigService } from './modules/harness/configs/numctx-config.service.js';
import { HarnessController } from './modules/harness/controllers/harness.controller.js';
import { HarnessModule } from './modules/harness/harness.module.js';
import { HarnessProcessor } from './modules/harness/processors/harness.processor.js';
import { HealthController } from './modules/health/controllers/health.controller.js';
import { HealthService } from './modules/health/services/health.service.js';
import { PostgresHealthIndicator } from './modules/health/services/postgres-health-indicator.service.js';
import { MemoryClientConfigService } from './modules/memory-client/configs/memory-client-config.service.js';
import { MemoryClientModule } from './modules/memory-client/memory-client.module.js';
import { MemoryHealthIndicator } from './modules/memory-client/services/memory-health-indicator.service.js';
import { MinioConfigService } from './modules/minio/configs/minio-config.service.js';
import { StorageController } from './modules/minio/controllers/storage.controller.js';
import { MinioModule } from './modules/minio/minio.module.js';
import { JobReinstatementService } from './modules/minio/services/job-reinstatement.service.js';
import { MinioHealthIndicator } from './modules/minio/services/minio-health-indicator.service.js';
import { OllamaConfigService } from './modules/ollama/configs/ollama-config.service.js';
import { OllamaModule } from './modules/ollama/ollama.module.js';
import { OllamaOverridesService } from './modules/ollama/services/ollama-overrides.service.js';
import { PersistenceModule } from './modules/persistence/persistence.module.js';
import { PlaywrightMcpConfigService } from './modules/playwright-mcp/configs/playwright-mcp-config.service.js';
import { BrightDataConfigService } from './modules/provider-overrides/configs/bright-data-config.service.js';
import { SerperConfigService } from './modules/provider-overrides/configs/serper-config.service.js';
import { ProviderOverridesController } from './modules/provider-overrides/controllers/provider-overrides.controller.js';
import { ProviderOverridesModule } from './modules/provider-overrides/provider-overrides.module.js';
import { SecretsModule } from './modules/secrets/secrets.module.js';
import { SharpConfigService } from './modules/sharp/configs/sharp-config.service.js';
import { SharpModule } from './modules/sharp/sharp.module.js';
import { SocketIOConfigService } from './modules/socket-io/configs/socket-io-config.service.js';
import { SocketIOEventsService } from './modules/socket-io/services/socket-io-events.service.js';

@Module({
  controllers: [
    HarnessController,
    HealthController,
    BullMQController,
    StorageController,
    DeadLetterController,
    ProviderOverridesController,
  ],
  providers: [
    Logger,
    HealthService,
    JobReinstatementService,
    MinioHealthIndicator,
    PostgresHealthIndicator,
    MemoryHealthIndicator,
    SocketIOEventsService,
    LifecycleService,
  ],
  imports: [
    HttpModule,
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
    HarnessModule,
    SharpModule,
    MinioModule,
    DeadLetterModule,
    PersistenceModule,
    ProviderOverridesModule,
    SecretsModule,
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
    ConfigFactoryModule.forRoot({
      global: true,
      providers: [
        AppConfigService,
        OllamaConfigService,
        BullMQConfigService,
        BullMQLoggerConfigService,
        PostgresConfigService,
        MinioConfigService,
        NumCtxConfigService,
        CoreLoggerConfigService,
        PlaywrightMcpConfigService,
        BrightDataConfigService,
        SerperConfigService,
        SharpConfigService,
        SocketIOConfigService,
        MemoryClientConfigService,
      ],
    }),
    CoreLoggerModule.registerAsync({
      global: true,
      inject: [CoreLoggerConfigService],
      useFactory: ({ config }: CoreLoggerConfigService) => config,
    }),
    SocketIOCoreModule.registerAsync({
      global: true,
      inject: [SocketIOConfigService],
      useFactory: async ({ config }: SocketIOConfigService) => config,
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
      processors: [HarnessProcessor],
      queues: [HARNESS_QUEUE, VECTORIZE_QUEUE],
    }),
    MemoryClientModule,
  ],
})
export class MainModule {}
