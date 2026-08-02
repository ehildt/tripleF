import { Global, Module } from '@nestjs/common';

import { SerperConfigService } from './configs/serper-config.service.js';
import { SourcesConfigService } from './configs/sources-config.service.js';
import { YoutubeConfigService } from './configs/youtube-config.service.js';
import { ProviderOverridesService } from './services/provider-overrides.service.js';

@Global()
@Module({
  providers: [
    ProviderOverridesService,
    SerperConfigService,
    SourcesConfigService,
    YoutubeConfigService,
  ],
  exports: [
    ProviderOverridesService,
    SerperConfigService,
    SourcesConfigService,
    YoutubeConfigService,
  ],
})
export class ProviderOverridesModule {}
