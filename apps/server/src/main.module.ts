import { BullMQModule } from '@ehildt/nestjs-bullmq';
import { BullMQLoggerModule } from '@ehildt/nestjs-bullmq-logger';
import { SocketIOModule as SocketIOCoreModule } from '@ehildt/nestjs-socket.io';
import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigFactoryModule } from '@triplef/config-factory/config-factory';

import { AppConfigService } from './configs/app-config.service.js';
import { AiSdkModule } from './modules/ai-sdk/ai-sdk.module.js';
import { OllamaConfigService } from './modules/ai-sdk/configs/ollama-config.service.js';
import { BullMQConfigService } from './modules/bullmq/configs/bullmq-config.service.js';
import { BullMQLoggerConfigService } from './modules/bullmq/configs/bullmq-logger-config.service.js';
import {
  HARNESS_QUEUE,
  VECTORIZE_QUEUE,
} from './modules/bullmq/constants/bullmq.constants.js';
import { BullMQController } from './modules/bullmq/controllers/bullmq.controller.js';
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
import { PersistenceModule } from './modules/persistence/persistence.module.js';
import { PinoLoggerConfigService } from './modules/pino-logger/configs/pino-logger-config.service.js';
import { PinoLoggerModule } from './modules/pino-logger/pino-logger.module.js';
import { PlaywrightMcpConfigService } from './modules/playwright-mcp/configs/playwright-mcp-config.service.js';
import { PlaywrightMcpModule } from './modules/playwright-mcp/playwright-mcp.module.js';
import { BrightDataConfigService } from './modules/provider-overrides/configs/bright-data-config.service.js';
import { SerperConfigService } from './modules/provider-overrides/configs/serper-config.service.js';
import { ProviderOverridesController } from './modules/provider-overrides/controllers/provider-overrides.controller.js';
import { ProviderOverridesModule } from './modules/provider-overrides/provider-overrides.module.js';
import { SecretsModule } from './modules/secrets/secrets.module.js';
import { SharpConfigService } from './modules/sharp/configs/sharp-config.service.js';
import { SharpModule } from './modules/sharp/sharp.module.js';
import { SocketIOConfigService } from './modules/socket-io/configs/socket-io-config.service.js';
import { SocketIOEventsService } from './modules/socket-io/services/socket-io-events.service.js';
import { SocketIOModule } from './modules/socket-io/socket-io.module.js';

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
    PinoLoggerModule,
    BullMQModule,
    AiSdkModule,
    HarnessModule,
    SharpModule,
    MinioModule,
    DeadLetterModule,
    PersistenceModule,
    PlaywrightMcpModule,
    ProviderOverridesModule,
    SecretsModule,
    SocketIOModule,
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
        PinoLoggerConfigService,
        PlaywrightMcpConfigService,
        BrightDataConfigService,
        SerperConfigService,
        SharpConfigService,
        SocketIOConfigService,
        MemoryClientConfigService,
      ],
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
