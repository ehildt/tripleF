import { DynamicModule, Module } from '@nestjs/common';

import { EncyclopediaModule } from '../encyclopedia/encyclopedia.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

import { ResearchConfigService } from './configs/research-config.service.js';
import { RESEARCH_CONFIG } from './constants/research.constants.js';
import { ResearchJobService } from './services/research-job.service.js';
import { ResearchProviderService } from './services/research-provider.service.js';

/**
 * The gap-filling maintenance researcher: env-backed provider config (its own
 * Serper/Bright Data keys, independent of the server) + the job service the
 * vectorize worker dispatches.
 */
@Module({})
export class ResearchModule {
  private static readonly registration: DynamicModule = {
    module: ResearchModule,
    exports: [RESEARCH_CONFIG, ResearchJobService],
    imports: [PersistenceModule.register(), EncyclopediaModule.register()],
    providers: [
      ResearchProviderService,
      ResearchJobService,
      {
        provide: RESEARCH_CONFIG,
        inject: [ResearchConfigService],
        useFactory: ({ config }: ResearchConfigService) => config,
      },
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return ResearchModule.registration;
  }
}
