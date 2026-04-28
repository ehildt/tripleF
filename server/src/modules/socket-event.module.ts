import { Global, Module } from '@nestjs/common';

import { AnalyzeImageService } from '../services/analyze-image.service.js';
import { ImagePreprocessingService } from '../services/image-preprocessing.service.js';
import { JobTrackingService } from '../services/job-tracking.service.js';
import { SocketService } from '../services/socket.service.js';

@Global()
@Module({
  providers: [
    JobTrackingService,
    SocketService,
    AnalyzeImageService,
    ImagePreprocessingService,
  ],
  exports: [JobTrackingService, SocketService, ImagePreprocessingService],
})
export class SocketEventModule {}
