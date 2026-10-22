import { DynamicModule, Module } from '@nestjs/common';
import { BullMQModule as BullMQCoreModule } from '@triplef/bullmq';
import { BullMQLoggerModule } from '@triplef/bullmq-logger';

import { DeadLetterModule } from '../dead-letter/dead-letter.module.js';
import { EncyclopediaModule } from '../encyclopedia/encyclopedia.module.js';
import { MemoryCognitionModule } from '../memory-cognition/memory-cognition.module.js';
import { MemoryPartitionModule } from '../memory-partition/memory-partition.module.js';
import { MemoryTaxonomyModule } from '../memory-taxonomy/memory-taxonomy.module.js';
import { ResearchModule } from '../research/research.module.js';

import { BullMQConfigService } from './configs/bullmq-config.service.js';
import { BullMQLoggerConfigService } from './configs/bullmq-logger-config.service.js';
import { VECTORIZE_QUEUE } from './constants/bullmq.constants.js';
import { VectorizeProcessor } from './processors/vectorize.processor.js';

/**
 * App-side queue wiring: registers the shared `vectorize` queue and its
 * worker on the shared BullMQ connection. The connection module is global
 * (a shared connection, like a database pool) so queue injection tokens
 * resolve in every feature module; the processor's dependencies are made
 * visible by importing its feature modules into the queue module.
 */
@Module({})
export class BullMQModule {
  private static readonly registration: DynamicModule = {
    module: BullMQModule,
    exports: [BullMQConfigService, BullMQLoggerConfigService],
    imports: [
      BullMQLoggerModule.registerAsync({
        global: true,
        inject: [BullMQLoggerConfigService],
        useFactory: async ({ config }: BullMQLoggerConfigService) => config,
      }),
      BullMQCoreModule.registerAsync({
        global: true,
        inject: [BullMQConfigService],
        useFactory: async ({ config }: BullMQConfigService) => config,
        processors: [VectorizeProcessor],
        queues: [VECTORIZE_QUEUE],
        imports: [
          DeadLetterModule.register(),
          MemoryTaxonomyModule.register(),
          MemoryCognitionModule.register(),
          MemoryPartitionModule.register(),
          EncyclopediaModule.register(),
          ResearchModule.register(),
        ],
      }),
    ],
    providers: [BullMQConfigService, BullMQLoggerConfigService],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return BullMQModule.registration;
  }
}
