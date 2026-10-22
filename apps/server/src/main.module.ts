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
import { PostgresConfigService } from './modules/dead-letter/configs/postgres-config.service.js';
import { DeadLetterModule } from './modules/dead-letter/dead-letter.module.js';
import { NumCtxConfigService } from './modules/harness/configs/numctx-config.service.js';
import { HarnessModule } from './modules/harness/harness.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MemoryClientConfigService } from './modules/memory-client/configs/memory-client-config.service.js';
import { MemoryClientModule } from './modules/memory-client/memory-client.module.js';
import { MinioConfigService } from './modules/minio/configs/minio-config.service.js';
import { MinioModule } from './modules/minio/minio.module.js';
import { OllamaConfigService } from './modules/ollama/configs/ollama-config.service.js';
import { OllamaModule } from './modules/ollama/ollama.module.js';
import { OllamaOverridesService } from './modules/ollama/services/ollama-overrides.service.js';
import { PersistenceModule } from './modules/persistence/persistence.module.js';
import { PlaywrightMcpConfigService } from './modules/playwright-mcp/configs/playwright-mcp-config.service.js';
import { PlaywrightMcpModule } from './modules/playwright-mcp/playwright-mcp.module.js';
import { BrightDataConfigService } from './modules/provider-overrides/configs/bright-data-config.service.js';
import { SerperConfigService } from './modules/provider-overrides/configs/serper-config.service.js';
import { ProviderOverridesModule } from './modules/provider-overrides/provider-overrides.module.js';
import { SecretsModule } from './modules/secrets/secrets.module.js';
import { SharpConfigService } from './modules/sharp/configs/sharp-config.service.js';
import { SharpModule } from './modules/sharp/sharp.module.js';
import { SocketIOConfigService } from './modules/socket-io/configs/socket-io-config.service.js';
import { SocketIOModule } from './modules/socket-io/socket-io.module.js';
import { StockDataModule } from './modules/stock-data/stock-data.module.js';

/**
 * Composition root: every feature folder registers itself through its
 * dynamic module; this file only sequences them and hosts what has no
 * feature home — the global env-config registry (ConfigFactoryModule) and
 * the two cross-cutting AI clients (Ollama API + AI SDK plumbing).
 */
@Module({
  imports: [
    OllamaApiModule.registerAsync({
      global: true,
      imports: [OllamaModule.register()],
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
    BullMQModule.register(),
    CoreLoggerModule.register(),
    SocketIOModule.register(),
    HealthModule.register(),
    PlaywrightMcpModule.register(),
    HarnessModule.register(),
    SharpModule.register(),
    MinioModule.register(),
    DeadLetterModule.register(),
    PersistenceModule.register(),
    ProviderOverridesModule.register(),
    SecretsModule.register(),
    OllamaModule.register(),
    MemoryClientModule.register(),
    StockDataModule.register(),
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
  ],
  providers: [Logger],
})
export class MainModule {}
