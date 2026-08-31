import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';

import { mapQueueRegistration } from './helpers/map-queue-registration.helper.js';
import { BullMQModuleProps } from './bullmq.model.ts';

@Module({})
export class BullMQModule {
  static registerAsync(options: BullMQModuleProps): DynamicModule {
    return {
      module: BullMQModule,
      exports: [BullModule],
      global: options.global,
      providers: options.processors,
      imports: [
        ...(options.imports ?? []),
        BullModule.registerQueueAsync(...options.queues.map((queue) => mapQueueRegistration(queue, options))),
      ]?.filter(Boolean),
    };
  }
}
