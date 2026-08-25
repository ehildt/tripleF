import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';

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
        BullModule.registerQueueAsync(
          ...options.queues.map((queue) => {
            const queueName = typeof queue === 'string' ? queue : queue.name;
            const queueConnection = typeof queue === 'object' ? queue.connection : undefined;

            return {
              name: queueName,
              global: options.global,
              inject: options.inject,
              useFactory: async (...deps: any[]) => {
                return {
                  ...((await options.useFactory(...deps)) ?? {}),
                  ...(queueConnection && { connection: queueConnection }),
                };
              },
            };
          }),
        ),
      ]?.filter(Boolean),
    };
  }
}
