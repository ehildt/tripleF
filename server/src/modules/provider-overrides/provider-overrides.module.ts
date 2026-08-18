import { Global, Module } from '@nestjs/common';

import { BrightDataConfigService } from './configs/bright-data-config.service.js';
import { EodhdConfigService } from './configs/eodhd-config.service.js';
import { SerperConfigService } from './configs/serper-config.service.js';
import { SourcesConfigService } from './configs/sources-config.service.js';
import { YoutubeConfigService } from './configs/youtube-config.service.js';
import { BrightDataDiscoveryService } from './services/brightdata-discovery.service.js';
import { EodhdDiscoveryService } from './services/eodhd-discovery.service.js';
import { ProviderOverridesService } from './services/provider-overrides.service.js';
import { SerperDiscoveryService } from './services/serper-discovery.service.js';

@Global()
@Module({
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
})
export class ProviderOverridesModule {}
