import { DynamicModule, Module } from '@nestjs/common';

import { PostgresConfigService } from './configs/postgres-config.service.js';
import { POSTGRES_CONFIG } from './constants/postgres.constants.js';

/**
 * Postgres connection config for the memory app: owns the env-backed config
 * service and the derived value token the repositories consume. The tables
 * are shared with the main server, which owns the Prisma schema and
 * migrations; this app reads/writes with its own generated client.
 */
@Module({})
export class PostgresModule {
  private static readonly registration: DynamicModule = {
    module: PostgresModule,
    exports: [PostgresConfigService, POSTGRES_CONFIG],
    providers: [
      PostgresConfigService,
      {
        provide: POSTGRES_CONFIG,
        inject: [PostgresConfigService],
        useFactory: (configService: PostgresConfigService) =>
          configService.config,
      },
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return PostgresModule.registration;
  }
}
