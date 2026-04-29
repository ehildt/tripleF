import { Global, Module } from '@nestjs/common';

import { AnalyzeImageService } from '../services/analyze-image.service.js';
import { ImagePreprocessingService } from '../services/image-preprocessing.service.js';

@Global()
@Module({
  providers: [AnalyzeImageService, ImagePreprocessingService],
  exports: [AnalyzeImageService, ImagePreprocessingService],
})
export class ImageModule {}
