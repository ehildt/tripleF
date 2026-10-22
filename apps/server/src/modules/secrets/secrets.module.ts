import { DynamicModule, Module } from '@nestjs/common';

import { SecretsConfigService } from './configs/secrets-config.service.js';
import { SecretsCipherService } from './services/secrets-cipher.service.js';

@Module({})
export class SecretsModule {
  private static readonly registration: DynamicModule = {
    module: SecretsModule,
    exports: [SecretsCipherService],
    providers: [SecretsConfigService, SecretsCipherService],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return SecretsModule.registration;
  }
}
