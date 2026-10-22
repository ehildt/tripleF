import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { MinioConfigService } from './configs/minio-config.service.js';
import { MINIO_CONFIG } from './constants/minio.constants.js';
import { StorageController } from './controllers/storage.controller.js';
import { MinioService } from './services/minio.service.js';
import { MinioHealthIndicator } from './services/minio-health-indicator.service.js';

/**
 * Object storage (bucket inspection + media upload/download for imported
 * documents) and its readiness indicator. TerminusModule is not global —
 * the health indicator resolves HealthIndicatorService from the importing
 * module's scope.
 */
@Module({})
export class MinioModule {
  private static readonly registration: DynamicModule = {
    module: MinioModule,
    controllers: [StorageController],
    exports: [
      MinioService,
      MinioConfigService,
      MINIO_CONFIG,
      MinioHealthIndicator,
    ],
    imports: [TerminusModule.forRoot({ errorLogStyle: 'pretty' })],
    providers: [
      MinioService,
      MinioConfigService,
      MinioHealthIndicator,
      {
        inject: [MinioConfigService],
        provide: MINIO_CONFIG,
        useFactory: (configService: MinioConfigService) => configService.config,
      },
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return MinioModule.registration;
  }
}
