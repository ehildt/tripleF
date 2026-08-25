import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { MemoryClientConfigService } from './configs/memory-client-config.service.js';
import { MEMORY_CLIENT_CONFIG } from './constants/memory-client.constants.js';
import { MemoryClientService } from './services/memory-client.service.js';
import { MemoryEnqueueService } from './services/memory-enqueue.service.js';
import { MemoryHealthIndicator } from './services/memory-health-indicator.service.js';

/**
 * The server's window onto the outsourced memory app: an HTTP client for the
 * sync read/write paths (tools, sanitize probe, health) plus the BullMQ
 * producer for the async vectorize path (the memory app runs the worker).
 * The dashboard talks to the memory app directly — no pass-through routes
 * live on the server anymore.
 */
@Global()
@Module({
  // TerminusModule is not global — the health indicator resolves
  // HealthIndicatorService from the importing module's scope.
  imports: [TerminusModule.forRoot({ errorLogStyle: 'pretty' })],
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
