import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  ApiDeleteObjects,
  ApiGetBucketInfo,
  ApiListObjects,
} from '../decorators/minio.openapi.js';
import { MinioService } from '../services/minio.service.js';

@ApiTags('Storage')
@Controller('storage')
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Get('info')
  @ApiGetBucketInfo()
  info() {
    return {
      bucket: this.minioService.config.bucket,
      endpoint: this.minioService.config.endpoint,
      port: this.minioService.config.port,
      useSsl: this.minioService.config.useSsl,
    };
  }

  @Get(':requestId')
  @ApiListObjects()
  async list(@Param('requestId') requestId: string) {
    const prefix = `jobs/${requestId}/`;
    const stream = this.minioService.client.listObjectsV2(
      this.minioService.config.bucket,
      prefix,
      false,
    );

    const objects: string[] = [];
    for await (const obj of stream) {
      if (obj.name) objects.push(obj.name);
    }

    if (objects.length === 0) throw new NotFoundException();

    return objects;
  }

  @Delete(':requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteObjects()
  async remove(@Param('requestId') requestId: string) {
    await this.minioService.deleteBuffers(requestId);
  }
}
