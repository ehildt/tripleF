import { DynamicModule, Module } from '@nestjs/common';
import { CoreLoggerModule as CoreLoggerCoreModule } from '@triplef/core-logger';

import { CoreLoggerConfigService } from './configs/core-logger-config.service.js';

/**
 * App logging: adapts the env-backed core-logger config into the shared
 * pino logger, registered globally so every module (and `main.ts`) resolves
 * the same CoreLoggerService instance.
 */
@Module({})
export class CoreLoggerModule {
  private static readonly registration: DynamicModule = {
    module: CoreLoggerModule,
    exports: [CoreLoggerConfigService],
    imports: [
      CoreLoggerCoreModule.registerAsync({
        global: true,
        inject: [CoreLoggerConfigService],
        useFactory: ({ config }: CoreLoggerConfigService) => config,
      }),
    ],
    providers: [CoreLoggerConfigService],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return CoreLoggerModule.registration;
  }
}
