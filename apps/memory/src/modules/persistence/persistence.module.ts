import { Global, Module } from '@nestjs/common';

import { PostgresConfigService } from '../postgres/configs/postgres-config.service.js';
import { POSTGRES_CONFIG } from '../postgres/constants/postgres.constants.js';

import { MemoryCognitionProfileRepository } from './services/memory-cognition-profile.repository.js';
import { ProviderOverridesRepository } from './services/provider-overrides.repository.js';

/**
 * Database access for the memory app. The Postgres tables (cognition
 * profiles, provider overrides) are shared with the main server: the server
 * owns the Prisma schema + migrations, this app consumes the same tables
 * with its own generated client — no migrations are run here.
 */
@Global()
@Module({
  providers: [
    PostgresConfigService,
    {
      provide: POSTGRES_CONFIG,
      inject: [PostgresConfigService],
      useFactory: (configService: PostgresConfigService) =>
        configService.config,
    },
    MemoryCognitionProfileRepository,
    ProviderOverridesRepository,
  ],
  exports: [
    PostgresConfigService,
    POSTGRES_CONFIG,
    MemoryCognitionProfileRepository,
    ProviderOverridesRepository,
  ],
})
export class PersistenceModule {}
