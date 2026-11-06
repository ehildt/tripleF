import { MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  AttachmentsField,
  DocumentTextLimitField,
  HarnessLLMHeader,
  HarnessStreamQuery,
  OriginalsField,
  PromptField,
} from '../decorators/harness.decorator.js';
import { ApiCancelJob, ApiHarness } from '../decorators/harness.openapi.js';
import {
  CancelHarnessJobDto,
  CancelHarnessJobResponseDto,
} from '../dtos/cancel-harness-job.dto.js';
import { HarnessControllerResponse } from '../dtos/harness-response.dto.js';
import { HarnessStreamQueryDto } from '../dtos/harness-stream-query.dto.js';
import { Prompt } from '../dtos/prompt.dto.js';
import { parseSessionMetadata } from '../helpers/json/parse-session-metadata.helper.js';
import { HarnessQueueService } from '../services/harness-queue.service.js';

import { mapPromptPreview } from './helpers/map-prompt-preview.helper.js';
import { mapSessionImage } from './helpers/map-session-image.helper.js';

/** Receive harness turns and cancel queued harness work. */
@ApiTags('Harness')
@Controller('harness')
export class HarnessController {
  private readonly logger = new Logger(HarnessController.name);

  constructor(private readonly harnessQueueService: HarnessQueueService) {}

  @Post()
  @ApiHarness()
  @HttpCode(HttpStatus.ACCEPTED)
  async harnessStream(
    @HarnessLLMHeader() model: string,
    @HarnessStreamQuery() query: HarnessStreamQueryDto,
    @PromptField() prompt?: Array<Prompt>,
    @AttachmentsField() attachments?: Array<MultipartFile>,
    @OriginalsField() originals?: Array<MultipartFile>,
    @DocumentTextLimitField() documentTextLimit?: number,
  ): Promise<HarnessControllerResponse> {
    if (!model) throw new BadRequestException('Missing x-harness-llm header');

    const { requestId, roomId, stream, numCtx, event, think, language } = query;
    const sessionMetadata = parseSessionMetadata(query.sessionMetadata);
    const frontendHashes = sessionMetadata?.images?.map((image) => image.hash);
    const frontendOriginalHashes = sessionMetadata?.originals?.map(
      (original) => original.hash,
    );
    const attachmentResults = await this.harnessQueueService.toFilePayloads(
      attachments ?? [],
      frontendHashes,
    );
    const originalResults = await this.harnessQueueService.toFilePayloads(
      originals ?? [],
      frontendOriginalHashes,
      false,
    );
    const results = [...attachmentResults, ...originalResults];

    this.logger.log(
      {
        requestId,
        step: 'receive',
        sessionId: query.sessionId,
        memoryPartition: query.memoryPartition ?? query.sessionId,
        memoryCognition: query.memoryCognition,
        conversationId: query.conversationId,
        roomId,
        hasNewImages: query.hasNewImages,
        newImageCount: results.length,
        promptMessages: Array.isArray(prompt)
          ? prompt.map(mapPromptPreview)
          : prompt
            ? [
                {
                  role: (prompt as Prompt).role,
                  content: (prompt as Prompt).content?.slice(0, 200),
                },
              ]
            : undefined,
        sessionMetadataImages: sessionMetadata?.images?.map(mapSessionImage),
      },
      'request received',
    );

    // Await durable storage before the 202 so the client's storage previews
    // cannot race the upload and briefly request missing objects.
    await this.harnessQueueService.emit({
      buffers: results.map((result) => result.buffer).filter(Boolean),
      meta: results.map((result) => result.meta).filter(Boolean),
      filters: {
        model,
        requestId,
        sessionId: query.sessionId,
        memoryPartition: query.memoryPartition,
        memoryCognition: query.memoryCognition,
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
        documentTextLimit,
        graphRag: query.graphRag,
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
}
