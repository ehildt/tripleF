import { Global, Module } from '@nestjs/common';

import { SerperConfigService } from './configs/serper-config.service.js';
import { SourcesConfigService } from './configs/sources-config.service.js';
import { ProviderOverridesService } from './services/provider-overrides.service.js';

@Global()
@Module({
  providers: [
    ProviderOverridesService,
    SerperConfigService,
    SourcesConfigService,
  ],
  exports: [
    ProviderOverridesService,
    SerperConfigService,
    SourcesConfigService,
  ],
})
export class ProviderOverridesModule {}
