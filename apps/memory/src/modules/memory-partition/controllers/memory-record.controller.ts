import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApeDeleteMemory,
  ApeGetMemoryList,
  ApePostMemoryText,
  ApeTagsMemory,
} from '../../qdrant/decorators/openapi/swagger.js';
import type { MemoryPoint } from '../../qdrant/models/memory.model.js';
import { MemoryRecordRepository } from '../../qdrant/services/memory-record.repository.js';
import { MemoryListQueryDto } from '../dtos/memory-list-query.dto.js';
import { MemoryPruneQueryDto } from '../dtos/memory-prune-query.dto.js';
import { MemoryPruneResponseDto } from '../dtos/memory-prune-response.dto.js';
import { MemorySendTextDto } from '../dtos/memory-send-text.dto.js';
import { VectorizeService } from '../services/vectorize.service.js';

import type { MemoryTextStoreResult } from './memory-record.controller.types.js';

/** List, ingest, and delete routes for memory records. */
@ApeTagsMemory()
@Controller('memory')
export class MemoryRecordController {
  constructor(
    private readonly memoryRepository: MemoryRecordRepository,
    private readonly vectorizeService: VectorizeService,
  ) {}

  @Get()
  @ApeGetMemoryList()
  async listMemory(@Query() query: MemoryListQueryDto): Promise<MemoryPoint[]> {
    return this.memoryRepository.listMemory({
      memoryPartition: query.memoryPartition,
      memoryCognition: query.memoryCognition,
      sessionId: query.sessionId,
      role: query.role,
      conversationId: query.conversationId,
      requestId: query.requestId,
      tags: query.tags,
      contains: query.contains,
      limit: query.limit,
    });
  }

  @Post('text')
  @HttpCode(HttpStatus.OK)
  @ApePostMemoryText()
  async sendText(
    @Body() body: MemorySendTextDto,
  ): Promise<MemoryTextStoreResult> {
    try {
      const id = await this.vectorizeService.storeRecord({
        memoryPartition: body.memoryPartition ?? body.sessionId,
        sessionId: body.sessionId,
        conversationId: body.conversationId,
        requestId: body.requestId,
        text: body.text,
        tags: body.tags,
        category: body.category,
        community: body.community,
        subject: body.subject,
        node: body.node,
      });
      return { accepted: true, id };
    } catch {
      // Feature off or embed/store outage — memory is a background concern.
      return { accepted: false };
    }
  }

  @Delete()
  @ApeDeleteMemory()
  async pruneMemory(
    @Query() query: MemoryPruneQueryDto,
  ): Promise<MemoryPruneResponseDto> {
    const deleted = query.conversationId
      ? await this.memoryRepository.deleteByConversation({
          memoryPartition: query.memoryPartition,
          conversationId: query.conversationId,
        })
      : await this.memoryRepository.deletePartitionData(query.memoryPartition);
    return { deleted };
  }
}
