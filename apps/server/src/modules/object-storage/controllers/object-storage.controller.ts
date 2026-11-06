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
} from '../decorators/object-storage.openapi.js';
import { ObjectStorageParamsDto } from '../dtos/object-storage-params.dto.js';
import { ObjectStorageService } from '../services/object-storage.service.js';

@ApiTags('Object Storage')
@Controller('object-storage')
export class ObjectStorageController {
  constructor(private readonly objectStorage: ObjectStorageService) {}

  @Get('info')
  @ApiGetBucketInfo()
  info() {
    return {
      bucket: this.objectStorage.config.bucket,
      endpoint: this.objectStorage.config.endpoint,
      region: this.objectStorage.config.region,
    };
  }

  @Get(':sessionId/:conversationId')
  @ApiListObjects()
  async list(@Param() params: ObjectStorageParamsDto) {
    const objects = await this.objectStorage.listObjectKeys(
      `images/${params.sessionId}/${params.conversationId}/`,
    );
    if (objects.length === 0) throw new NotFoundException();
    return objects;
  }

  @Get(':sessionId/:conversationId/:hash')
  @ApiGetObject()
  async getObject(
    @Param() params: ObjectStorageParamsDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const { stream, meta } = await this.objectStorage.getObjectStreamAndMeta(
        params.sessionId,
        params.conversationId,
        params.hash!,
      );
      void res.type(meta.ContentType ?? 'application/octet-stream');
      // A transient 404 must not become a cached broken image.
      res.header('Cache-Control', 'public, max-age=3600');
      return res.send(stream);
    } catch {
      throw new NotFoundException();
    }
  }

  @Get(':sessionId/:conversationId/:hash/exists')
  @ApiObjectExists()
  async exists(@Param() params: ObjectStorageParamsDto) {
    const exists = await this.objectStorage.objectExists(
      params.sessionId,
      params.conversationId,
      params.hash!,
    );
    return { exists };
  }

  @Delete(':sessionId/:conversationId/:hash')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteObject()
  async removeObject(@Param() params: ObjectStorageParamsDto) {
    await this.objectStorage.deleteObject(
      params.sessionId,
      params.conversationId,
      params.hash!,
    );
  }

  @Delete(':sessionId/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteObjects()
  async remove(@Param() params: ObjectStorageParamsDto) {
    const objectKeys = await this.objectStorage.listObjectKeys(
      `images/${params.sessionId}/${params.conversationId}/`,
    );
    await this.objectStorage.deleteObjectKeys(objectKeys);
  }
}
