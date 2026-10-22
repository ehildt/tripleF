import { DynamicModule, Module } from '@nestjs/common';
import { BullMQModule as BullMQCoreModule } from '@triplef/bullmq';
import { BullMQLoggerModule } from '@triplef/bullmq-logger';

import { DeadLetterModule } from '../dead-letter/dead-letter.module.js';
import { HarnessModule } from '../harness/harness.module.js';
import { HarnessProcessor } from '../harness/processors/harness.processor.js';

import { BullMQConfigService } from './configs/bullmq-config.service.js';
import { BullMQLoggerConfigService } from './configs/bullmq-logger-config.service.js';
import {
  HARNESS_QUEUE,
  VECTORIZE_QUEUE,
} from './constants/bullmq.constants.js';
import { BullMQController } from './controllers/bullmq.controller.js';

/**
 * App-side queue wiring: registers the harness/vectorize queues and the
 * harness worker on the shared BullMQ connection. The connection module is
 * global (a shared connection, like a database pool) so queue injection
 * tokens resolve in every feature module; the processor's dependencies are
 * made visible by importing its feature modules into the queue module.
 * Also hosts the queue introspection endpoints consumed by the dashboard.
 */
@Module({})
export class BullMQModule {
  private static readonly registration: DynamicModule = {
    module: BullMQModule,
    controllers: [BullMQController],
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
        processors: [HarnessProcessor],
        queues: [HARNESS_QUEUE, VECTORIZE_QUEUE],
        imports: [HarnessModule.register(), DeadLetterModule.register()],
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
