import { Global, Module } from '@nestjs/common';

import { PostgresConfigService } from '../../configs/postgres-config.service.js';
import { POSTGRES_CONFIG } from '../../constants/postgres.constants.js';

import { DeadLetterRepository } from './services/repository.service.js';

@Global()
@Module({
  exports: [DeadLetterRepository],
  providers: [
    DeadLetterRepository,
    {
      inject: [PostgresConfigService],
      provide: POSTGRES_CONFIG,
      useFactory: (configService: PostgresConfigService) =>
        configService.config,
    },
  ],
})
export class DeadLetterModule {}
