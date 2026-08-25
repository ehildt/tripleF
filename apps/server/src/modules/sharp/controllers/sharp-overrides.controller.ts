import { MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { hashPayload } from '@triplef/helpers/hash-payload';

import { AttachmentsField } from '../../harness/decorators/harness.decorator.js';
import type { FastifyMultipartMeta } from '../../harness/dtos/harness-job.dto.js';
import {
  type SharpOverridesPatch,
  SharpOverridesService,
} from '../services/sharp-overrides.service.js';
import { SharpPreviewService } from '../services/sharp-preview.service.js';

@ApiTags('Sharp Overrides')
@Controller('sharp-overrides')
export class SharpOverridesController {
  constructor(
    private readonly sharpOverrides: SharpOverridesService,
    private readonly sharpPreview: SharpPreviewService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Current preprocessing configuration' })
  getConfig() {
    return this.sharpOverrides.getConfig();
  }

  @Put()
  @ApiOperation({ summary: 'Update preprocessing configuration overrides' })
  updateConfig(@Body() body: SharpOverridesPatch) {
    this.sharpOverrides.updateConfig(body);
    return { success: true };
  }

  @Post('preview')
  @ApiOperation({
    summary:
      'Run an uploaded image through the current preprocessing config and return the variants',
  })
  async preview(@AttachmentsField() images?: Array<MultipartFile>) {
    const image = images?.[0];
    if (!image) throw new BadRequestException('Missing image file');
    const buffer = await image.toBuffer();
    const meta: FastifyMultipartMeta = {
      name: image.filename,
      type: image.mimetype,
      hash: `${hashPayload(buffer, 'sha256')}`,
    };
    return this.sharpPreview.preview(buffer, meta);
  }
}
