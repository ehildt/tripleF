import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import {
  ApiDeleteObject,
  ApiDeleteObjects,
  ApiGetBucketInfo,
  ApiGetObject,
  ApiListObjects,
  ApiObjectExists,
} from '../decorators/minio.openapi.js';
import { StorageParamsDto } from '../dtos/storage-params.dto.js';
import { MinioService } from '../services/minio.service.js';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
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

  @Get(':sessionId/:conversationId')
  @ApiListObjects()
  async list(@Param() params: StorageParamsDto) {
    const prefix = `images/${params.sessionId}/${params.conversationId}/`;
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

  @Get(':sessionId/:conversationId/:hash')
  @ApiGetObject()
  async getObject(@Param() params: StorageParamsDto, @Res() res: FastifyReply) {
    try {
      const { stream, meta } = await this.minioService.getObjectStreamAndMeta(
        params.sessionId,
        params.conversationId,
        params.hash!,
      );
      const contentType = meta['content-type'] ?? 'application/octet-stream';
      void res.type(contentType);
      // Cache only successful responses: a 404 must never be cached, or a
      // transient miss (e.g. a preview requested before the upload landed)
      // would stick as a broken image for the whole max-age window.
      res.header('Cache-Control', 'public, max-age=3600');
      return res.send(stream);
    } catch {
      throw new NotFoundException();
    }
  }

  @Get(':sessionId/:conversationId/:hash/exists')
  @ApiObjectExists()
  async exists(@Param() params: StorageParamsDto) {
    const exists = await this.minioService.objectExists(
      params.sessionId,
      params.conversationId,
      params.hash!,
    );
    return { exists };
  }

  @Delete(':sessionId/:conversationId/:hash')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteObject()
  async removeObject(@Param() params: StorageParamsDto) {
    await this.minioService.deleteObject(
      params.sessionId,
      params.conversationId,
      params.hash!,
    );
  }

  @Delete(':sessionId/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteObjects()
  async remove(@Param() params: StorageParamsDto) {
    await this.minioService.client.removeObjects(
      this.minioService.config.bucket,
      await this.listObjectNames(params.sessionId, params.conversationId),
    );
  }

  private async listObjectNames(
    sessionId: string,
    conversationId: string,
  ): Promise<string[]> {
    const prefix = `images/${sessionId}/${conversationId}/`;
    const stream = this.minioService.client.listObjectsV2(
      this.minioService.config.bucket,
      prefix,
      true,
    );
    const objects: string[] = [];
    for await (const obj of stream) if (obj.name) objects.push(obj.name);
    return objects;
  }
}
