import { DynamicModule, Module } from '@nestjs/common';

import { ConfigFactoryOptions } from './config-factory.model.ts';

/**
 * NestJS module for registering and exporting configuration providers.
 * Provides a way to register multiple config services as a single dynamic module.
 */
@Module({})
export class ConfigFactoryModule {
  /**
   * Creates a dynamic module with the specified configuration providers.
   * All providers are automatically exported for use by other modules.
   *
   * @param options - Configuration options
   * @param options.global - Whether to register as a global module
   * @param options.providers - Array of configuration provider classes
   *
   * @example
   * ConfigFactoryModule.forRoot({
   *   global: true,
   *   providers: [DatabaseConfigService, AppConfigService],
   * });
   */
  static forRoot({ global = false, providers = [] }: ConfigFactoryOptions = {}): DynamicModule {
    if (!providers.length)
      // eslint-disable-next-line no-console
      console.warn('[ConfigFactoryModule] No providers registered.');

    return {
      global,
      module: ConfigFactoryModule,
      providers,
      exports: providers,
    };
  }
}
