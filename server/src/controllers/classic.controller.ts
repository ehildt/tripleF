import { MultipartFile, MultipartValue } from '@fastify/multipart';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SocketIOConfigService } from '../configs/socket-io-config.service.js';
import {
  EVENT,
  IMAGES,
  NUM_CTX,
  PROMPT,
  REQUEST_ID,
  ROOM_ID,
  STREAM,
  TASK,
  X_VISION_LLM,
} from '../decorators/constants.js';
import {
  MultiPartFiles,
  MultiPartValue,
  QueryBool,
  QueryNumber,
} from '../decorators/visions.decorator.js';
import { ApiCancelJob, ApiVision } from '../decorators/visions.openapi.js';
import { CancelJobDto, CancelJobResponseDto } from '../dtos/cancel-job.dto.js';
import { ClassicControllerResponse } from '../dtos/classic/classic-response.dto.js';
import { VisionTask } from '../dtos/classic/get-fastify-multipart-data-req.dto.js';
import { Prompt } from '../dtos/prompt.dto.js';
import { ParsePromptPipe } from '../pipes/parse-prompt.pipe.js';
import { AnalyzeImageService } from '../services/analyze-image.service.js';
import { OllamaModelsService } from '../services/ollama-models.service.js';

@ApiTags('Images')
@Controller('vision')
export class ClassicController {
  constructor(
    private readonly analyzeImageService: AnalyzeImageService,
    private readonly ollamaModelsService: OllamaModelsService,
    private readonly socketIOConfigService: SocketIOConfigService,
    private readonly logger: Logger,
  ) {}

  @Post()
  @ApiVision()
  @HttpCode(HttpStatus.ACCEPTED)
  async visionStream(
    @Query(REQUEST_ID) requestId: string,
    @Headers(X_VISION_LLM) vLLM: string,
    @Query(STREAM, new ParseBoolPipe({ optional: true })) stream: boolean,
    @MultiPartValue(TASK) task: MultipartValue<VisionTask>,
    @Query(ROOM_ID) roomId?: string,
    @MultiPartValue(PROMPT, new ParsePromptPipe()) prompt?: Array<Prompt>,
    @Query(NUM_CTX, new ParseIntPipe({ optional: true })) numCtx?: number,
    @Query(EVENT) eventQuery?: string,
    // Preprocessing query params
    @QueryBool('pproc_enabled') pprocEnabled?: boolean,
    @QueryBool('pproc_original') pprocOriginal?: boolean,
    @QueryBool('pproc_grayscale') pprocGrayscale?: boolean,
    @QueryBool('pproc_denoised') pprocDenoised?: boolean,
    @QueryBool('pproc_sharpened') pprocSharpened?: boolean,
    @QueryBool('pproc_clahe') pprocClahe?: boolean,
    @QueryNumber('pproc_resize_maxWidth') pprocResizeMaxWidth?: number,
    @QueryNumber('pproc_resize_maxHeight') pprocResizeMaxHeight?: number,
    @QueryBool('pproc_resize_withoutEnlargement')
    pprocResizeWithoutEnlargement?: boolean,
    @QueryNumber('pproc_blurSigma') pprocBlurSigma?: number,
    @QueryNumber('pproc_sharpenSigma') pprocSharpenSigma?: number,
    @QueryNumber('pproc_sharpenM1') pprocSharpenM1?: number,
    @QueryNumber('pproc_sharpenM2') pprocSharpenM2?: number,
    @QueryNumber('pproc_brightnessLevel') pprocBrightnessLevel?: number,
    @QueryNumber('pproc_claheWidth') pprocClaheWidth?: number,
    @QueryNumber('pproc_claheHeight') pprocClaheHeight?: number,
    @QueryNumber('pproc_claheMaxSlope') pprocClaheMaxSlope?: number,
    @QueryNumber('pproc_normalizeLower') pprocNormalizeLower?: number,
    @QueryNumber('pproc_normalizeUpper') pprocNormalizeUpper?: number,
    @MultiPartFiles({
      fieldName: IMAGES,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    })
    images?: Array<MultipartFile>,
  ): Promise<ClassicControllerResponse> {
    if (!vLLM) throw new BadRequestException('Missing x-vision-llm header');
    const results = await this.analyzeImageService.toFilePayloads(
      requestId,
      images ?? [],
    );

    const event = eventQuery ?? this.socketIOConfigService.config.event;

    // Build preprocessing options if enabled
    const preprocessing = pprocEnabled
      ? {
          enabled: true,
          resize: {
            maxWidth: pprocResizeMaxWidth as
              | (1024 | 768 | 640 | 512 | 384 | 256)
              | undefined,
            maxHeight: pprocResizeMaxHeight,
            withoutEnlargement: pprocResizeWithoutEnlargement,
          },
          variants: {
            original: pprocOriginal ?? true,
            grayscale: pprocGrayscale ?? true,
            denoised: pprocDenoised ?? true,
            sharpened: pprocSharpened ?? false,
            clahe: pprocClahe ?? true,
          },
          parameters: {
            blurSigma: pprocBlurSigma,
            sharpenSigma: pprocSharpenSigma,
            sharpenM1: pprocSharpenM1,
            sharpenM2: pprocSharpenM2,
            brightnessLevel: pprocBrightnessLevel,
            claheWidth: pprocClaheWidth,
            claheHeight: pprocClaheHeight,
            claheMaxSlope: pprocClaheMaxSlope,
            normalizeLower: pprocNormalizeLower,
            normalizeUpper: pprocNormalizeUpper,
          },
        }
      : undefined;

    void this.analyzeImageService.emit({
      buffers: results.map((r) => r.buffer).filter(Boolean),
      meta: results.map((r) => r.meta).filter(Boolean),
      filters: {
        vLLM,
        requestId,
        roomId,
        stream,
        numCtx,
        prompt,
        task: task?.value,
        event,
        preprocessing,
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
  async cancelJob(@Body() body: CancelJobDto): Promise<CancelJobResponseDto> {
    const canceled = await this.analyzeImageService.cancel(body.requestId);

    return {
      success: canceled,
      message: canceled
        ? 'Job canceled successfully'
        : 'Job not found or already completed',
      requestId: body.requestId,
    };
  }

  @Get('models')
  @ApiOperation({
    summary: 'List available Ollama models',
    description:
      'Returns all models currently available on the connected Ollama instance.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of models' })
  async getModels() {
    return this.ollamaModelsService.getModels();
  }
}
