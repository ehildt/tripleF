import { DynamicModule, Module } from '@nestjs/common';
import type { LoggerOptions } from 'pino';

import { NESTJS_PINO_OPTIONS } from './bullmq-logger.constants.ts';
import { BullMQLoggerService } from './bullmq-logger.service.ts';

type LoggerConfigFactory = (...deps: any[]) => Promise<LoggerOptions> | LoggerOptions;

interface BullMQLoggerModuleOptions {
  global?: boolean;
  inject: Array<any>;
  useFactory: LoggerConfigFactory;
}

/**
 * Dynamic module for registering the BullMQ job logger with pino options.
 * Use `registerAsync()` to supply the pino `LoggerOptions` via a factory.
 */
@Module({})
export class BullMQLoggerModule {
  /** Registers the module asynchronously with pino logger configuration. */
  static registerAsync(options: BullMQLoggerModuleOptions): DynamicModule {
    const optionsProvider = {
      provide: NESTJS_PINO_OPTIONS,
      inject: options.inject,
      useFactory: options.useFactory,
    };
    return {
      global: options.global,
      module: BullMQLoggerModule,
      exports: [NESTJS_PINO_OPTIONS, BullMQLoggerService],
      providers: [optionsProvider, BullMQLoggerService],
    };
  }
}
