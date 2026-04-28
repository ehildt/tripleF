import { Global, Module } from '@nestjs/common';

import { PostgresConfigService } from '../configs/postgres-config.service.js';
import { POSTGRES_CONFIG } from '../constants/postgres.constants.js';
import { PostgresService } from '../services/postgres.service.js';

@Global()
@Module({
  exports: [PostgresService],
  providers: [
    PostgresService,
    {
      inject: [PostgresConfigService],
      provide: POSTGRES_CONFIG,
      useFactory: (configService: PostgresConfigService) =>
        configService.config,
    },
  ],
})
export class PostgresModule {}
