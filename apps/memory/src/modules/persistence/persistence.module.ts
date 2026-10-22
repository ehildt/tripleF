import { DynamicModule, Module } from '@nestjs/common';

import { PostgresModule } from '../postgres/postgres.module.js';

import { EncyclopediaLedgerRepository } from './services/encyclopedia-ledger.repository.js';
import { MemoryClusterRepository } from './services/memory-cluster.repository.js';
import { MemoryCognitionProfileRepository } from './services/memory-cognition-profile.repository.js';
import { MemoryFrictionRepository } from './services/memory-friction.repository.js';
import { MemoryInsertLedgerRepository } from './services/memory-insert-ledger.repository.js';
import { MemoryLinkRepository } from './services/memory-link.repository.js';
import { MemoryMainNodeRepository } from './services/memory-main-node.repository.js';
import { MemoryTaxonomyRepository } from './services/memory-taxonomy.repository.js';
import { ProviderOverridesRepository } from './services/provider-overrides.repository.js';

/**
 * Database access for the memory app. The Postgres tables (cognition
 * profiles, provider overrides) are shared with the main server: the server
 * owns the Prisma schema + migrations, this app consumes the same tables
 * with its own generated client — no migrations are run here.
 */
@Module({})
export class PersistenceModule {
  private static readonly registration: DynamicModule = {
    module: PersistenceModule,
    exports: [
      MemoryCognitionProfileRepository,
      MemoryInsertLedgerRepository,
      EncyclopediaLedgerRepository,
      MemoryLinkRepository,
      MemoryFrictionRepository,
      MemoryClusterRepository,
      MemoryMainNodeRepository,
      MemoryTaxonomyRepository,
      ProviderOverridesRepository,
    ],
    imports: [PostgresModule.register()],
    providers: [
      MemoryCognitionProfileRepository,
      MemoryInsertLedgerRepository,
      EncyclopediaLedgerRepository,
      MemoryLinkRepository,
      MemoryFrictionRepository,
      MemoryClusterRepository,
      MemoryMainNodeRepository,
      MemoryTaxonomyRepository,
      ProviderOverridesRepository,
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return PersistenceModule.registration;
  }
}
