import { randomUUID } from 'node:crypto';

import { MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import { ModelWarmupService } from '../../ai-sdk/services/model-warmup.service.js';
import { OllamaModelsService } from '../../ai-sdk/services/ollama-models.service.js';
import { NumCtxConfigService } from '../configs/numctx-config.service.js';
import {
  AttachmentsField,
  DocumentHashesField,
  DocumentTextLimitField,
  HarnessLLMHeader,
  HarnessStreamQuery,
  OriginalsField,
  PromptField,
} from '../decorators/harness.decorator.js';
import {
  ApiCancelJob,
  ApiConvertDocuments,
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
import { DocumentConversionService } from '../services/document-conversion.service.js';
import { HarnessQueueService } from '../services/harness-queue.service.js';

import { mapPageImage } from './helpers/map-page-image.helper.js';
import { mapPromptPreview } from './helpers/map-prompt-preview.helper.js';
import { mapSessionImage } from './helpers/map-session-image.helper.js';

@ApiTags('Harness')
@Controller('harness')
export class HarnessController {
  private readonly logger = new Logger(HarnessController.name);

  constructor(
    private readonly harnessQueueService: HarnessQueueService,
    private readonly documentConversionService: DocumentConversionService,
    private readonly ollamaModelsService: OllamaModelsService,
    private readonly numCtxConfigService: NumCtxConfigService,
    private readonly modelWarmupService: ModelWarmupService,
  ) {}

  @Post('documents')
  @ApiConvertDocuments()
  async convertDocuments(
    @Query()
    query: { sessionId?: string; conversationId?: string },
    @OriginalsField() originals?: Array<MultipartFile>,
    @DocumentHashesField() hashes?: string,
  ): Promise<{ documents: ConvertedDocumentResult[] }> {
    const providedHashes = parseHashesField(hashes);
    const payloads = originals?.length
      ? await this.harnessQueueService.toFilePayloads(
          originals,
          providedHashes,
          false,
        )
      : [];

    const documents: ConvertedDocumentResult[] = [];
    const requestId = randomUUID();
    for (const { buffer, meta } of payloads) {
      const manifest = await this.documentConversionService.convertAndPersist(
        query.sessionId,
        query.conversationId,
        requestId,
        meta,
        buffer,
      );
      if (!manifest) continue;
      documents.push({
        name: meta.name,
        hash: meta.hash,
        type: meta.type,
        kind: manifest.kind,
        pageImages:
          manifest.kind === 'pdf'
            ? manifest.pageHashes.map((hash, index) =>
                mapPageImage(hash, index, meta.name),
              )
            : undefined,
      });
    }

    return { documents };
  }

  @Post()
  @ApiHarness()
  @HttpCode(HttpStatus.ACCEPTED)
  async harnessStream(
    @HarnessLLMHeader() model: string,
    @HarnessStreamQuery() query: HarnessStreamQueryDto,
    @PromptField() prompt?: Array<Prompt>,
    @AttachmentsField() attachments?: Array<MultipartFile>,
    @OriginalsField() originals?: Array<MultipartFile>,
    @DocumentTextLimitField() documentTextLimit?: string,
  ): Promise<HarnessControllerResponse> {
    if (!model) throw new BadRequestException('Missing x-harness-llm header');

    const { requestId, roomId, stream, numCtx, event, think, language } = query;
    const sessionMetadata = parseSessionMetadata(query.sessionMetadata);
    const frontendHashes = sessionMetadata?.images?.map((img) => img.hash);
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

    // Await the MinIO upload before answering: the client promotes pending
    // previews to storage URLs as soon as the 202 lands, so the bytes must be
    // durably stored first — otherwise the first preview request races the
    // putObject and 404s. Enqueueing stays inside emit (fast, fire-and-forget
    // from the client's perspective once the upload is done).
    await this.harnessQueueService.emit({
      buffers: results.map((r) => r.buffer).filter(Boolean),
      meta: results.map((r) => r.meta).filter(Boolean),
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
        documentTextLimit: documentTextLimit
          ? Number(documentTextLimit) || undefined
          : undefined,
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
    if (ifNoneMatch === etag) return res.status(HttpStatus.NOT_MODIFIED).send();
    return res.send(payload);
  }
}

/** One converted original returned by the select-time documents endpoint. */
interface ConvertedDocumentResult {
  name: string;
  hash: string;
  type: string;
  kind: 'pdf' | 'docx' | 'pptx' | 'text';
  /** Rendered page images (pdf only) — the client shows these as tiles. */
  pageImages?: Array<{ name: string; hash: string }>;
}

function parseHashesField(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((hash): hash is string => typeof hash === 'string')
      : undefined;
  } catch {
    return undefined;
  }
}
