import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { MemoryClientConfigService } from './configs/memory-client-config.service.js';
import { MEMORY_CLIENT_CONFIG } from './constants/memory-client.constants.js';
import { MemoryOverridesProxyController } from './controllers/memory-overrides-proxy.controller.js';
import { QdrantProxyController } from './controllers/qdrant-proxy.controller.js';
import { MemoryClientService } from './services/memory-client.service.js';
import { MemoryEnqueueService } from './services/memory-enqueue.service.js';
import { MemoryHealthIndicator } from './services/memory-health-indicator.service.js';

/**
 * The server's window onto the outsourced memory app: an HTTP client for the
 * sync read/write paths (tools, sanitize probe, health) plus the BullMQ
 * producer for the async vectorize path (the memory app runs the worker).
 * Dashboard pass-through controllers keep the /api/v1/qdrant* and
 * /api/v1/memory-overrides* routes alive on the server.
 */
@Global()
@Module({
  // TerminusModule is not global — the health indicator resolves
  // HealthIndicatorService from the importing module's scope.
  imports: [TerminusModule.forRoot({ errorLogStyle: 'pretty' })],
  controllers: [QdrantProxyController, MemoryOverridesProxyController],
  providers: [
    MemoryClientConfigService,
    {
      provide: MEMORY_CLIENT_CONFIG,
      inject: [MemoryClientConfigService],
      useFactory: (configService: MemoryClientConfigService) =>
        configService.config,
    },
    MemoryClientService,
    MemoryEnqueueService,
    MemoryHealthIndicator,
  ],
  exports: [
    MemoryClientConfigService,
    MEMORY_CLIENT_CONFIG,
    MemoryClientService,
    MemoryEnqueueService,
    MemoryHealthIndicator,
  ],
})
export class MemoryClientModule {}
