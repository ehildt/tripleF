import { DynamicModule, Module } from '@nestjs/common';

import { MemoryTaxonomyModule } from '../memory-taxonomy/memory-taxonomy.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

import { EncyclopediaConfigService } from './configs/encyclopedia-config.service.js';
import { ENCYCLOPEDIA_CONFIG } from './constants/encyclopedia.constants.js';
import { EncyclopediaController } from './controllers/encyclopedia.controller.js';
import { EncyclopediaMaintenanceController } from './controllers/encyclopedia-maintenance.controller.js';
import { EncyclopediaClassifyService } from './services/encyclopedia-classify.service.js';
import { EncyclopediaIngestTriageService } from './services/encyclopedia-ingest-triage.service.js';
import { EncyclopediaQueryService } from './services/encyclopedia-query.service.js';
import { EncyclopediaSelectService } from './services/encyclopedia-select.service.js';
import { EncyclopediaStoreService } from './services/encyclopedia-store.service.js';
import { EncyclopediaSweepService } from './services/encyclopedia-sweep.service.js';

/**
 * The encyclopedia lane: the shared, not-partition-scoped knowledge base —
 * query/select/index controllers, the store/sweep/classify maintenance
 * services, and the ingest triage. Exports serve the vectorize processor
 * (sweep/classify jobs) and the research lane (store).
 */
@Module({})
export class EncyclopediaModule {
  private static readonly registration: DynamicModule = {
    module: EncyclopediaModule,
    controllers: [EncyclopediaController, EncyclopediaMaintenanceController],
    exports: [
      ENCYCLOPEDIA_CONFIG,
      EncyclopediaStoreService,
      EncyclopediaSweepService,
      EncyclopediaClassifyService,
    ],
    imports: [PersistenceModule.register(), MemoryTaxonomyModule.register()],
    providers: [
      EncyclopediaConfigService,
      EncyclopediaQueryService,
      EncyclopediaSelectService,
      EncyclopediaStoreService,
      EncyclopediaSweepService,
      EncyclopediaClassifyService,
      EncyclopediaIngestTriageService,
      {
        provide: ENCYCLOPEDIA_CONFIG,
        inject: [EncyclopediaConfigService],
        useFactory: ({ config }: EncyclopediaConfigService) => config,
      },
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return EncyclopediaModule.registration;
  }
}
