import { Global, Module } from '@nestjs/common';

import { PostgresConfigService } from './configs/postgres-config.service.js';
import { POSTGRES_CONFIG } from './constants/postgres.constants.js';
import { DlqEventsService } from './services/dlq-events.service.js';
import { DeadLetterRepository } from './services/repository.service.js';

@Global()
@Module({
  exports: [
    DeadLetterRepository,
    PostgresConfigService,
    POSTGRES_CONFIG,
    DlqEventsService,
  ],
  providers: [
    DeadLetterRepository,
    PostgresConfigService,
    DlqEventsService,
    {
      inject: [PostgresConfigService],
      provide: POSTGRES_CONFIG,
      useFactory: (configService: PostgresConfigService) =>
        configService.config,
    },
  ],
})
export class DeadLetterModule {}
