import { Global, Module } from '@nestjs/common';

import { SharpConfigService } from './configs/sharp-config.service.js';
import { SharpOverridesController } from './controllers/sharp-overrides.controller.js';
import { ImagePipelineFactory } from './services/image-pipeline-factory.service.js';
import { ImageVariantProcessor } from './services/image-variant-processor.service.js';
import { SharpService } from './services/sharp.service.js';
import { SharpOverridesService } from './services/sharp-overrides.service.js';

@Global()
@Module({
  controllers: [SharpOverridesController],
  providers: [
    SharpService,
    SharpConfigService,
    SharpOverridesService,
    ImagePipelineFactory,
    ImageVariantProcessor,
  ],
  exports: [SharpService, SharpConfigService, SharpOverridesService],
})
export class SharpModule {}
