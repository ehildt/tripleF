import { BullMQModule } from '@ehildt/nestjs-bullmq';
import { BullMQLoggerModule } from '@ehildt/nestjs-bullmq-logger';
import { ConfigFactoryModule } from '@ehildt/nestjs-config-factory/config-factory';
import { SocketIOModule as SocketIOCoreModule } from '@ehildt/nestjs-socket.io';
import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { AppConfigService } from './configs/app-config.service.js';
import { BraveConfigService } from './configs/brave-config.service.js';
import { BullMQConfigService } from './configs/bullmq-config.service.js';
import { BullMQLoggerConfigService } from './configs/bullmq-logger-config.service.js';
import { MinioConfigService } from './configs/minio-config.service.js';
import { NumCtxConfigService } from './configs/numctx-config.service.js';
import { OllamaConfigService } from './configs/ollama-config.service.js';
import { PostgresConfigService } from './configs/postgres-config.service.js';
import { SearXNGConfigService } from './configs/searxng-config.service.js';
import { SerperConfigService } from './configs/serper-config.service.js';
import { SocketIOConfigService } from './configs/socket-io-config.service.js';
import { HARNESS_QUEUE } from './constants/bullmq.constants.js';
import { BullMQController } from './controllers/bullmq.controller.js';
import { AiSdkModule } from './modules/ai-sdk/ai-sdk.module.js';
import { DeadLetterController } from './modules/dead-letter/controllers/dead-letter.controller.js';
import { DeadLetterModule } from './modules/dead-letter/dead-letter.module.js';
import { LifecycleService } from './modules/dead-letter/services/lifecycle.service.js';
import { HarnessController } from './modules/harness/controllers/harness.controller.js';
import { HarnessModule } from './modules/harness/harness.module.js';
import { HarnessProcessor } from './modules/harness/processors/harness.processor.js';
import { HealthController } from './modules/health/controllers/health.controller.js';
import { HealthService } from './modules/health/services/health.service.js';
import { PostgresHealthIndicator } from './modules/health/services/postgres-health-indicator.service.js';
import { SearXNGHealthIndicator } from './modules/health/services/searxng-health-indicator.service.js';
import { StorageController } from './modules/minio/controllers/storage.controller.js';
import { MinioModule } from './modules/minio/minio.module.js';
import { JobReinstatementService } from './modules/minio/services/job-reinstatement.service.js';
import { MinioHealthIndicator } from './modules/minio/services/minio-health-indicator.service.js';
import { ProviderOverridesController } from './modules/provider-overrides/controllers/provider-overrides.controller.js';
import { ProviderOverridesModule } from './modules/provider-overrides/provider-overrides.module.js';
import { SharpConfigService } from './modules/sharp/configs/sharp-config.service.js';
import { SharpModule } from './modules/sharp/sharp.module.js';
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
    SearXNGHealthIndicator,
    SocketIOEventsService,
    LifecycleService,
  ],
  imports: [
    HttpModule,
    AiSdkModule,
    HarnessModule,
    SharpModule,
    MinioModule,
    DeadLetterModule,
    ProviderOverridesModule,
    SocketIOModule,
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
    ConfigFactoryModule.forRoot({
      global: true,
      providers: [
        AppConfigService,
        BraveConfigService,
        BullMQConfigService,
        BullMQLoggerConfigService,
        SharpConfigService,
        MinioConfigService,
        NumCtxConfigService,
        OllamaConfigService,
        PostgresConfigService,
        SearXNGConfigService,
        SerperConfigService,
        SocketIOConfigService,
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
      queues: [HARNESS_QUEUE],
    }),
  ],
})
export class MainModule {}
