import { DynamicModule, Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence/persistence.module.js';
import { SecretsModule } from '../secrets/secrets.module.js';

import { BrightDataConfigService } from './configs/bright-data-config.service.js';
import { EodhdConfigService } from './configs/eodhd-config.service.js';
import { SerperConfigService } from './configs/serper-config.service.js';
import { SourcesConfigService } from './configs/sources-config.service.js';
import { YoutubeConfigService } from './configs/youtube-config.service.js';
import { ProviderOverridesController } from './controllers/provider-overrides.controller.js';
import { BrightDataDiscoveryService } from './services/brightdata-discovery.service.js';
import { EodhdDiscoveryService } from './services/eodhd-discovery.service.js';
import { ProviderOverridesService } from './services/provider-overrides.service.js';
import { SerperDiscoveryService } from './services/serper-discovery.service.js';

@Module({})
export class ProviderOverridesModule {
  private static readonly registration: DynamicModule = {
    module: ProviderOverridesModule,
    controllers: [ProviderOverridesController],
    exports: [
      ProviderOverridesService,
      EodhdDiscoveryService,
      SerperDiscoveryService,
      BrightDataDiscoveryService,
      BrightDataConfigService,
      EodhdConfigService,
      SerperConfigService,
      SourcesConfigService,
      YoutubeConfigService,
    ],
    imports: [PersistenceModule.register(), SecretsModule.register()],
    providers: [
      ProviderOverridesService,
      EodhdDiscoveryService,
      SerperDiscoveryService,
      BrightDataDiscoveryService,
      BrightDataConfigService,
      EodhdConfigService,
      SerperConfigService,
      SourcesConfigService,
      YoutubeConfigService,
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return ProviderOverridesModule.registration;
  }
}
