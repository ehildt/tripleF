import { Global, Module } from '@nestjs/common';

import { SerperConfigService } from './configs/serper-config.service.js';
import { ProviderOverridesService } from './services/provider-overrides.service.js';

@Global()
@Module({
  providers: [ProviderOverridesService, SerperConfigService],
  exports: [ProviderOverridesService, SerperConfigService],
})
export class ProviderOverridesModule {}
