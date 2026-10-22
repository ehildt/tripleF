import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { MemoryClientConfigService } from './configs/memory-client-config.service.js';
import { MEMORY_CLIENT_CONFIG } from './constants/memory-client.constants.js';
import { MemoryCognitionService } from './services/memory-cognition.service.js';
import { MemoryEncyclopediaService } from './services/memory-encyclopedia.service.js';
import { MemoryEnqueueService } from './services/memory-enqueue.service.js';
import { MemoryHealthIndicator } from './services/memory-health-indicator.service.js';
import { MemoryHttpTransportService } from './services/memory-http-transport.service.js';
import { MemoryOverridesService } from './services/memory-overrides.service.js';
import { MemoryPartitionRecordsService } from './services/memory-partition-records.service.js';
import { MemoryStatusService } from './services/memory-status.service.js';
import { MemorySynopsesService } from './services/memory-synopses.service.js';

/**
 * The server's window onto the outsourced memory app: an HTTP client for the
 * sync read/write paths (tools, sanitize probe, health) plus the BullMQ
 * producer for the async vectorize path (the memory app runs the worker).
 * The dashboard talks to the memory app directly — no pass-through routes
 * live on the server anymore.
 */
@Module({})
export class MemoryClientModule {
  private static readonly registration: DynamicModule = {
    module: MemoryClientModule,
    exports: [
      MemoryClientConfigService,
      MEMORY_CLIENT_CONFIG,
      MemoryEnqueueService,
      MemoryHealthIndicator,
      MemoryPartitionRecordsService,
      MemorySynopsesService,
      MemoryCognitionService,
      MemoryEncyclopediaService,
      MemoryStatusService,
      MemoryOverridesService,
    ],
    // TerminusModule is not global — the health indicator resolves
    // HealthIndicatorService from the importing module's scope.
    imports: [TerminusModule.forRoot({ errorLogStyle: 'pretty' })],
    providers: [
      MemoryClientConfigService,
      {
        provide: MEMORY_CLIENT_CONFIG,
        inject: [MemoryClientConfigService],
        useFactory: ({ config }: MemoryClientConfigService) => config,
      },
      MemoryEnqueueService,
      MemoryHealthIndicator,
      MemoryHttpTransportService,
      MemoryPartitionRecordsService,
      MemorySynopsesService,
      MemoryCognitionService,
      MemoryEncyclopediaService,
      MemoryStatusService,
      MemoryOverridesService,
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return MemoryClientModule.registration;
  }
}
