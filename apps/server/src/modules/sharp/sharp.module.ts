import { DynamicModule, Module } from '@nestjs/common';

import { SharpConfigService } from './configs/sharp-config.service.js';
import { SharpOverridesController } from './controllers/sharp-overrides.controller.js';
import { ImagePipelineFactory } from './services/image-pipeline-factory.service.js';
import { ImageVariantProcessor } from './services/image-variant-processor.service.js';
import { SharpService } from './services/sharp.service.js';
import { SharpOverridesService } from './services/sharp-overrides.service.js';
import { SharpPreviewService } from './services/sharp-preview.service.js';

@Module({})
export class SharpModule {
  private static readonly registration: DynamicModule = {
    module: SharpModule,
    controllers: [SharpOverridesController],
    exports: [SharpService, SharpConfigService, SharpOverridesService],
    providers: [
      SharpService,
      SharpConfigService,
      SharpOverridesService,
      SharpPreviewService,
      ImagePipelineFactory,
      ImageVariantProcessor,
    ],
  };

  /**
   * Shared registration object: this app uses Nest's default by-reference
   * dynamic-module ids, so one object per module class keeps multi-site
   * imports a single shared instance (static-module singleton semantics).
   */
  static register(): DynamicModule {
    return SharpModule.registration;
  }
}
