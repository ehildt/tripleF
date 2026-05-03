import { MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { NumCtxConfigService } from '../../../configs/numctx-config.service.js';
import { normalizeThink } from '../../ai-sdk/helpers/ollama.helpers.js';
import { OllamaModelsService } from '../../ai-sdk/services/ollama-models.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import {
  HarnessLLMHeader,
  HarnessStreamQuery,
  ImagesField,
  PromptField,
} from '../decorators/harness.decorator.js';
import {
  ApiCancelJob,
  ApiCompact,
  ApiGetModels,
  ApiHarness,
} from '../decorators/harness.openapi.js';
import {
  CancelHarnessJobDto,
  CancelHarnessJobResponseDto,
} from '../dtos/cancel-harness-job.dto.js';
import { CompactRequestDto, CompactResponseDto } from '../dtos/compact.dto.js';
import { HarnessControllerResponse } from '../dtos/harness-response.dto.js';
import { HarnessStreamQueryDto } from '../dtos/harness-stream-query.dto.js';
import { Prompt } from '../dtos/prompt.dto.js';
import { HarnessQueueService } from '../services/harness-queue.service.js';

@ApiTags('Harness')
@Controller('harness')
export class HarnessController {
  private readonly logger = new Logger(HarnessController.name);

  constructor(
    private readonly harnessQueueService: HarnessQueueService,
    private readonly ollamaModelsService: OllamaModelsService,
    private readonly numCtxConfigService: NumCtxConfigService,
    private readonly imagePreprocessingService: SharpService,
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

    const { requestId, roomId, stream, numCtx, event, think } = query;
    const preprocessing = this.imagePreprocessingService.buildOptions(query);
    const sessionMetadata = this.parseSessionMetadata(query.sessionMetadata);
    const frontendHashes = sessionMetadata?.images?.map((img) => img.hash);
    const results = await this.harnessQueueService.toFilePayloads(
      images ?? [],
      frontendHashes,
    );

    this.logger.log('[HARNESS] receive request', {
      requestId,
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
        preprocessing,
        hasNewImages: query.hasNewImages,
        sessionMetadata: query.sessionMetadata,
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

  private parseSessionMetadata(
    raw?: string,
  ): { images?: Array<{ name: string; hash: string }> } | undefined {
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.images)) return { images: [] };
      return {
        images: parsed.images.filter(
          (img: any): img is { name: string; hash: string } =>
            typeof img.name === 'string' && typeof img.hash === 'string',
        ),
      };
    } catch {
      return undefined;
    }
  }

  @Post('compact')
  @ApiCompact()
  @HttpCode(HttpStatus.ACCEPTED)
  async compact(@Body() body: CompactRequestDto): Promise<CompactResponseDto> {
    const {
      exchanges,
      model,
      requestId,
      roomId,
      stream,
      event,
      think,
      keepAlive,
      numCtx,
    } = body;

    if (!exchanges?.length)
      throw new BadRequestException('No exchanges provided to compact');

    const success = await this.harnessQueueService.emitCompact({
      exchanges,
      model,
      requestId,
      roomId,
      stream,
      event,
      think: normalizeThink(think),
      keepAlive,
      numCtx,
    });

    if (!success) throw new BadRequestException('Failed to queue compact job');

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

  @Get('models')
  @ApiGetModels()
  async getModels() {
    const models = await this.ollamaModelsService.getModels();
    return { ...models, numCtxOptions: this.numCtxConfigService.config };
  }
}
