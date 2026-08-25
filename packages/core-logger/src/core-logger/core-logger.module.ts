import { DynamicModule, Module } from '@nestjs/common';
import type { LoggerOptions } from 'pino';

import { CORE_LOGGER_OPTIONS, CoreLoggerService } from './core-logger.service.ts';

type LoggerConfigFactory = (...deps: any[]) => Promise<LoggerOptions> | LoggerOptions;

interface CoreLoggerModuleOptions {
  global?: boolean;
  inject: Array<any>;
  useFactory: LoggerConfigFactory;
}

/**
 * Dynamic module for registering the pino-backed core logger. Use
 * `registerAsync()` to supply the pino `LoggerOptions` via a factory (the
 * env-driven config lives in the consuming app, not in this library).
 */
@Module({})
export class CoreLoggerModule {
  static registerAsync(options: CoreLoggerModuleOptions): DynamicModule {
    const optionsProvider = {
      provide: CORE_LOGGER_OPTIONS,
      inject: options.inject,
      useFactory: options.useFactory,
    };
    return {
      global: options.global,
      module: CoreLoggerModule,
      exports: [CORE_LOGGER_OPTIONS, CoreLoggerService],
      providers: [optionsProvider, CoreLoggerService],
    };
  }
}
