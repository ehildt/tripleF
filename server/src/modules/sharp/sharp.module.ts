import { Global, Module } from '@nestjs/common';

import { SharpConfigService } from './configs/sharp-config.service.js';
import { ImagePipelineFactory } from './services/image-pipeline-factory.service.js';
import { ImageVariantProcessor } from './services/image-variant-processor.service.js';
import { SharpService } from './services/sharp.service.js';
import { SharpOptionsBuilder } from './services/sharp-options-builder.service.js';

@Global()
@Module({
  providers: [
    SharpService,
    SharpConfigService,
    SharpOptionsBuilder,
    ImagePipelineFactory,
    ImageVariantProcessor,
  ],
  exports: [SharpService, SharpConfigService],
})
export class SharpModule {}
