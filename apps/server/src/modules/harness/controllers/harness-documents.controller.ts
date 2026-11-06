import { randomUUID } from 'node:crypto';

import { MultipartFile } from '@fastify/multipart';
import { Controller, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  DocumentHashesField,
  OriginalsField,
} from '../decorators/harness.decorator.js';
import { ApiConvertDocuments } from '../decorators/harness.openapi.js';
import { ConvertDocumentsQueryDto } from '../dtos/convert-documents-query.dto.js';
import { DocumentConversionService } from '../services/document-conversion.service.js';
import { HarnessQueueService } from '../services/harness-queue.service.js';

import { mapPageImage } from './helpers/map-page-image.helper.js';
import type {
  ConvertDocumentsResult,
  ConvertedDocumentResult,
} from './harness-documents.controller.types.js';

/** Convert, persist, and index uploaded original documents. */
@ApiTags('Harness')
@Controller('harness')
export class HarnessDocumentsController {
  constructor(
    private readonly harnessQueueService: HarnessQueueService,
    private readonly documentConversionService: DocumentConversionService,
  ) {}

  @Post('documents')
  @ApiConvertDocuments()
  async convertDocuments(
    @Query() query: ConvertDocumentsQueryDto,
    @OriginalsField() originals?: Array<MultipartFile>,
    @DocumentHashesField() hashes?: string[],
  ): Promise<ConvertDocumentsResult> {
    const payloads = originals?.length
      ? await this.harnessQueueService.toFilePayloads(originals, hashes, false)
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
      // Index extracted text at upload time, before the first document query.
      this.documentConversionService.indexManifest(
        query.sessionId,
        query.conversationId,
        meta,
        manifest,
      );
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
}
