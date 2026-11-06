import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OllamaApiService } from '@triplef/ollama-api';
import type { FastifyReply } from 'fastify';

import { ModelWarmupService } from '../../ollama/services/model-warmup.service.js';
import { NumCtxConfigService } from '../configs/numctx-config.service.js';
import { ApiGetModels, ApiWarmModel } from '../decorators/harness.openapi.js';
import { WarmModelDto, WarmModelResponseDto } from '../dtos/warm-model.dto.js';
import { buildCatalogEtag } from '../helpers/catalog-etag.helper.js';

/** Model-catalog, context-option, and warmup routes. */
@ApiTags('Harness')
@Controller('harness')
export class HarnessModelsController {
  constructor(
    private readonly ollamaApiService: OllamaApiService,
    private readonly numCtxConfigService: NumCtxConfigService,
    private readonly modelWarmupService: ModelWarmupService,
  ) {}

  @Post('warm')
  @ApiWarmModel()
  async warmModel(@Body() body: WarmModelDto): Promise<WarmModelResponseDto> {
    this.modelWarmupService.warm(body.model);
    return { success: true, model: body.model };
  }

  @Get('models')
  @ApiGetModels()
  async getModels(
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res() res: FastifyReply,
  ): Promise<FastifyReply> {
    const models = await this.ollamaApiService.getModels();
    const payload = {
      ...models,
      numCtxOptions: this.numCtxConfigService.config,
    };
    const etag = buildCatalogEtag(payload);
    res.header('ETag', etag);
    if (ifNoneMatch === etag) return res.status(HttpStatus.NOT_MODIFIED).send();
    return res.send(payload);
  }
}
