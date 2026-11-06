import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { ObjectStorageConfigService } from './configs/object-storage-config.service.js';
import { OBJECT_STORAGE_CONFIG } from './constants/object-storage.constants.js';
import { ObjectStorageController } from './controllers/object-storage.controller.js';
import { ObjectStorageService } from './services/object-storage.service.js';
import { ObjectStorageHealthIndicator } from './services/object-storage-health-indicator.service.js';

/**
 * S3-compatible object storage for imported media and its readiness indicator.
 * TerminusModule stays scoped so the health indicator resolves correctly.
 */
@Module({})
export class ObjectStorageModule {
  private static readonly registration: DynamicModule = {
    module: ObjectStorageModule,
    controllers: [ObjectStorageController],
    exports: [
      ObjectStorageService,
      ObjectStorageConfigService,
      OBJECT_STORAGE_CONFIG,
      ObjectStorageHealthIndicator,
    ],
    imports: [TerminusModule.forRoot({ errorLogStyle: 'pretty' })],
    providers: [
      ObjectStorageService,
      ObjectStorageConfigService,
      ObjectStorageHealthIndicator,
      {
        inject: [ObjectStorageConfigService],
        provide: OBJECT_STORAGE_CONFIG,
        useFactory: ({ config }: ObjectStorageConfigService) => config,
      },
    ],
  };

  /** Keep Nest's by-reference dynamic-module identity stable across imports. */
  static register(): DynamicModule {
    return ObjectStorageModule.registration;
  }
}
