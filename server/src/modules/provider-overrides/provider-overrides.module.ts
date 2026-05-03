import { Global, Module } from '@nestjs/common';

import { BrowserBaseConfigService } from '../../configs/browser-base-config.service.js';

import { ProviderOverridesService } from './services/provider-overrides.service.js';

@Global()
@Module({
  providers: [ProviderOverridesService, BrowserBaseConfigService],
  exports: [ProviderOverridesService, BrowserBaseConfigService],
})
export class ProviderOverridesModule {}
