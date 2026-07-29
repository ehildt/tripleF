import { Global, Module } from '@nestjs/common';

import { SecretsConfigService } from './configs/secrets-config.service.js';
import { SecretsCipherService } from './services/secrets-cipher.service.js';

@Global()
@Module({
  providers: [SecretsConfigService, SecretsCipherService],
  exports: [SecretsCipherService],
})
export class SecretsModule {}
