import { MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import { ModelWarmupService } from '../../ai-sdk/services/model-warmup.service.js';
import { OllamaModelsService } from '../../ai-sdk/services/ollama-models.service.js';
import { NumCtxConfigService } from '../configs/numctx-config.service.js';
import {
  HarnessLLMHeader,
  HarnessStreamQuery,
  ImagesField,
  PromptField,
} from '../decorators/harness.decorator.js';
import {
  ApiCancelJob,
  ApiGetModels,
  ApiHarness,
  ApiWarmModel,
} from '../decorators/harness.openapi.js';
import {
  CancelHarnessJobDto,
  CancelHarnessJobResponseDto,
} from '../dtos/cancel-harness-job.dto.js';
import { HarnessControllerResponse } from '../dtos/harness-response.dto.js';
import { HarnessStreamQueryDto } from '../dtos/harness-stream-query.dto.js';
import { Prompt } from '../dtos/prompt.dto.js';
import { WarmModelDto, WarmModelResponseDto } from '../dtos/warm-model.dto.js';
import { buildCatalogEtag } from '../helpers/catalog-etag.helper.js';
import { parseSessionMetadata } from '../helpers/json/parse-session-metadata.helper.js';
import { HarnessQueueService } from '../services/harness-queue.service.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';

@ApiTags('Harness')
@Controller('harness')
export class HarnessController {
  constructor(
    private readonly harnessQueueService: HarnessQueueService,
    private readonly ollamaModelsService: OllamaModelsService,
    private readonly numCtxConfigService: NumCtxConfigService,
    private readonly modelWarmupService: ModelWarmupService,
    private readonly stepLogger: HarnessStepLogger,
  ) {}

  @Post()
  @ApiHarness()
  @HttpCode(HttpStatus.ACCEPTED)
  async harnessStream(
    @HarnessLLMHeader() model: string,
    @HarnessStreamQuery() query: HarnessStreamQueryDto,
    @PromptField() prompt?: Array<Prompt>,
    @ImagesField() images?: Array<MultipartFile>,
  ): Promise<HarnessControllerResponse> {
    if (!model) throw new BadRequestException('Missing x-harness-llm header');

    const { requestId, roomId, stream, numCtx, event, think, language } = query;
    const sessionMetadata = parseSessionMetadata(query.sessionMetadata);
    const frontendHashes = sessionMetadata?.images?.map((img) => img.hash);
    const results = await this.harnessQueueService.toFilePayloads(
      images ?? [],
      frontendHashes,
    );

    this.stepLogger.log({ requestId }, 'receive', 'request received', {
      sessionId: query.sessionId,
      conversationId: query.conversationId,
      roomId,
      hasNewImages: query.hasNewImages,
      newImageCount: results.length,
      promptMessages: Array.isArray(prompt)
        ? prompt.map((p) => ({
            role: p.role,
            content: p.content?.slice(0, 200),
          }))
        : prompt
          ? [
              {
                role: (prompt as Prompt).role,
                content: (prompt as Prompt).content?.slice(0, 200),
              },
            ]
          : undefined,
      sessionMetadataImages: sessionMetadata?.images?.map(({ name, hash }) => ({
        name,
        hash,
      })),
    });

    void this.harnessQueueService.emit({
      buffers: results.map((r) => r.buffer).filter(Boolean),
      meta: results.map((r) => r.meta).filter(Boolean),
      filters: {
        model,
        requestId,
        sessionId: query.sessionId,
        conversationId: query.conversationId,
        roomId,
        stream,
        numCtx,
        prompt,
        event,
        think,
        hasNewImages: query.hasNewImages,
        sessionMetadata: query.sessionMetadata,
        language,
      },
    });

    return {
      realtime: {
        event,
        roomId,
        requestId,
      },
    };
  }

  @Post('cancel')
  @ApiCancelJob()
  async cancelJob(
    @Body() body: CancelHarnessJobDto,
  ): Promise<CancelHarnessJobResponseDto> {
    const canceled = await this.harnessQueueService.cancel(body.requestId);

    return {
      success: canceled,
      message: canceled
        ? 'Job canceled successfully'
        : 'Job not found or already completed',
      requestId: body.requestId,
    };
  }

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
  ) {
    const models = await this.ollamaModelsService.getModels();
    const payload = {
      ...models,
      numCtxOptions: this.numCtxConfigService.config,
    };
    const etag = buildCatalogEtag(payload);
    res.header('ETag', etag);
    if (ifNoneMatch === etag) {
      return res.status(HttpStatus.NOT_MODIFIED).send();
    }
    return res.send(payload);
  }
}
