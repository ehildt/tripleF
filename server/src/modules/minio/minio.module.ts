import { Global, Module } from '@nestjs/common';

import { MinioConfigService } from './configs/minio-config.service.js';
import { MINIO_CONFIG } from './constants/minio.constants.js';
import { MinioService } from './services/minio.service.js';

@Global()
@Module({
  exports: [MinioService, MinioConfigService, MINIO_CONFIG],
  providers: [
    MinioService,
    MinioConfigService,
    {
      inject: [MinioConfigService],
      provide: MINIO_CONFIG,
      useFactory: (configService: MinioConfigService) => configService.config,
    },
  ],
})
export class MinioModule {}
