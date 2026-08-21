import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { MemoryCognitionSnapshotDto } from '../dtos/memory-cognition-snapshot.dto.js';
import { MemoryDeleteQueryDto } from '../dtos/memory-delete-query.dto.js';
import { MemoryDeleteResponseDto } from '../dtos/memory-delete-response.dto.js';
import { MemoryItemDto } from '../dtos/memory-item.dto.js';
import { MemoryListQueryDto } from '../dtos/memory-list-query.dto.js';
import { MemoryPruneQueryDto } from '../dtos/memory-prune-query.dto.js';
import { MemoryPruneResponseDto } from '../dtos/memory-prune-response.dto.js';
import { MemorySearchTextDto } from '../dtos/memory-search-text.dto.js';
import { MemorySearchVectorDto } from '../dtos/memory-search-vector.dto.js';
import { MemorySendTextDto } from '../dtos/memory-send-text.dto.js';
import { QdrantStatusResponseDto } from '../dtos/qdrant-status.dto.js';
import type { MemoryPoint } from '../models/memory.model.js';
import { MemoryRepository } from '../services/memory.repository.js';
import { MemoryCognitionService } from '../services/memory-cognition.service.js';
import { MemorySearchService } from '../services/memory-search.service.js';
import { QdrantClientService } from '../services/qdrant-client.service.js';
import { VectorizeService } from '../services/vectorize.service.js';

@ApiTags('Qdrant')
@Controller('qdrant')
export class QdrantController {
  constructor(
    private readonly qdrantClientService: QdrantClientService,
    private readonly memoryRepository: MemoryRepository,
    private readonly memorySearchService: MemorySearchService,
    private readonly memoryCognitionService: MemoryCognitionService,
    private readonly vectorizeService: VectorizeService,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Qdrant collection status (feature flag, existence, indexes)',
  })
  @ApiResponse({ status: 200, type: QdrantStatusResponseDto })
  async status(): Promise<QdrantStatusResponseDto> {
    return this.qdrantClientService.getStatus();
  }

  @Get('memory/cognition')
  @ApiOperation({
    summary:
      'The AI cognition snapshot of one space: the structured profile document (Postgres) plus derived insights (Qdrant)',
  })
  @ApiResponse({ status: 200, type: MemoryCognitionSnapshotDto })
  async getCognition(
    @Query('memoryCognition') memoryCognition?: string,
  ): Promise<MemoryCognitionSnapshotDto> {
    const space = memoryCognition?.trim();
    if (!space) {
      throw new BadRequestException('memoryCognition is required');
    }
    const profile = await this.memoryCognitionService.getProfile(space);
    const insights = await this.memoryCognitionService.listInsights(space, 100);
    return {
      profile: profile ? JSON.stringify(profile) : null,
      insights,
    };
  }

  @Get('memory')
  @ApiOperation({
    summary: 'List memory records; all params are optional tightenings',
  })
  @ApiResponse({ status: 200, type: [MemoryItemDto] })
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
  @ApiOperation({
    summary: 'Store a text verbatim as one memory record (sync)',
  })
  @ApiResponse({
    status: 200,
    description:
      'accepted:true with the stored point id; accepted:false when the feature is disabled or the store failed.',
  })
  async sendText(@Body() body: MemorySendTextDto) {
    try {
      const id = await this.vectorizeService.storeRecord({
        memoryPartition: body.memoryPartition ?? body.sessionId,
        sessionId: body.sessionId,
        conversationId: body.conversationId,
        requestId: body.requestId,
        text: body.text,
      });
      return { accepted: true, id };
    } catch {
      // Feature off or embed/store outage — memory is a background concern.
      return { accepted: false };
    }
  }

  @Delete('text')
  @ApiOperation({
    summary:
      "Delete memory records by filters, or the AI's cognition document (cognition=true)",
  })
  @ApiResponse({ status: 200, type: MemoryDeleteResponseDto })
  async deleteText(
    @Query() query: MemoryDeleteQueryDto,
  ): Promise<MemoryDeleteResponseDto> {
    const partition = query.memoryPartition ?? query.sessionId;
    if (!partition) {
      throw new BadRequestException(
        'Deletes are never anonymous: pass memoryPartition or sessionId',
      );
    }

    // Cognition mode: wipe the AI's whole understanding of the user (the
    // structured profile + every derived insight) — no further matcher needed.
    if (query.cognition === true) {
      const texts =
        await this.memoryCognitionService.deleteCognition(partition);
      return { deleted: texts.length, texts };
    }

    const hasMatcher =
      query.text ||
      query.contains ||
      query.tags?.length ||
      query.conversationId ||
      query.requestId;
    if (!hasMatcher) {
      // The mem0 rule: never execute an unscoped delete. Whole-partition
      // wipes have their own endpoint (DELETE /qdrant/memory).
      throw new BadRequestException(
        'Pass at least one matcher (text, contains, tags, conversationId, requestId)',
      );
    }

    try {
      return await this.vectorizeService.deleteRecords({
        memoryPartition: partition,
        sessionId: query.sessionId,
        conversationId: query.conversationId,
        requestId: query.requestId,
        text: query.text,
        contains: query.contains,
        tags: query.tags,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'memory delete failed',
      );
    }
  }

  @Post('search/text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search memory by text (embeds the query, then searches)',
  })
  @ApiResponse({ status: 200, type: [MemoryItemDto] })
  async searchByText(
    @Body() body: MemorySearchTextDto,
  ): Promise<MemoryPoint[]> {
    return this.memorySearchService.searchByText({
      memoryPartition: body.memoryPartition,
      sessionId: body.sessionId,
      text: body.text,
      limit: body.limit,
      role: body.role,
      conversationId: body.conversationId,
      requestId: body.requestId,
      tags: body.tags,
      contains: body.contains,
    });
  }

  @Post('search/vector')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search memory by a raw query vector' })
  @ApiResponse({ status: 200, type: [MemoryItemDto] })
  async searchByVector(
    @Body() body: MemorySearchVectorDto,
  ): Promise<MemoryPoint[]> {
    return this.memorySearchService.searchByVector({
      memoryPartition: body.memoryPartition,
      sessionId: body.sessionId,
      vector: body.vector,
      limit: body.limit,
      role: body.role,
      conversationId: body.conversationId,
      requestId: body.requestId,
      tags: body.tags,
      contains: body.contains,
    });
  }

  @Delete('memory')
  @ApiOperation({
    summary:
      'Prune the caller partition: its fact records only (or one conversation of it) — the AI cognition lane has its own wipe endpoint',
  })
  @ApiResponse({ status: 200, type: MemoryPruneResponseDto })
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
