import { DynamicModule, Module } from '@nestjs/common';

import { MinioModule } from '../minio/minio.module.js';

import { PostgresConfigService } from './configs/postgres-config.service.js';
import { POSTGRES_CONFIG } from './constants/postgres.constants.js';
import { DeadLetterController } from './controllers/dead-letter.controller.js';
import { DlqEventsService } from './services/dlq-events.service.js';
import { JobReinstatementService } from './services/job-reinstatement.service.js';
import { LifecycleService } from './services/lifecycle.service.js';
import { DeadLetterRepository } from './services/repository.service.js';

@Module({})
export class DeadLetterModule {
  private static readonly registration: DynamicModule = {
    module: DeadLetterModule,
    controllers: [DeadLetterController],
    exports: [
      DeadLetterRepository,
      PostgresConfigService,
      POSTGRES_CONFIG,
      DlqEventsService,
      LifecycleService,
    ],
    imports: [MinioModule.register()],
    providers: [
      DeadLetterRepository,
      PostgresConfigService,
      DlqEventsService,
      LifecycleService,
      JobReinstatementService,
      {
        inject: [PostgresConfigService],
        provide: POSTGRES_CONFIG,
        useFactory: (configService: PostgresConfigService) =>
          configService.config,
      },
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return DeadLetterModule.registration;
  }
}
