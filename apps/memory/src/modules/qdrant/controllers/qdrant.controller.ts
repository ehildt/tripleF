import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
} from '@nestjs/common';

import { MemoryInsertLedgerRepository } from '../../persistence/services/memory-insert-ledger.repository.js';
import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import {
  ApeDeleteQdrantMemory,
  ApeDeleteQdrantText,
  ApeGetQdrantMemory,
  ApeGetQdrantMemoryCognition,
  ApeGetQdrantStatus,
  ApePostQdrantConsolidate,
  ApePostQdrantSearchText,
  ApePostQdrantSearchVector,
  ApePostQdrantText,
  ApeTagsQdrant,
} from '../decorators/openapi/swagger.js';
import { MemoryCognitionSnapshotDto } from '../dtos/memory-cognition-snapshot.dto.js';
import { MemoryConsolidateBodyDto } from '../dtos/memory-consolidate-body.dto.js';
import { MemoryConsolidateResponseDto } from '../dtos/memory-consolidate-response.dto.js';
import { MemoryDeleteQueryDto } from '../dtos/memory-delete-query.dto.js';
import { MemoryDeleteResponseDto } from '../dtos/memory-delete-response.dto.js';
import { MemoryListQueryDto } from '../dtos/memory-list-query.dto.js';
import { MemoryPruneQueryDto } from '../dtos/memory-prune-query.dto.js';
import { MemoryPruneResponseDto } from '../dtos/memory-prune-response.dto.js';
import { MemorySearchTextDto } from '../dtos/memory-search-text.dto.js';
import { MemorySearchVectorDto } from '../dtos/memory-search-vector.dto.js';
import { MemorySendTextDto } from '../dtos/memory-send-text.dto.js';
import { QdrantStatusResponseDto } from '../dtos/qdrant-status.dto.js';
import type { MemoryPoint } from '../models/memory.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';
import { MemoryRepository } from '../services/memory.repository.js';
import { MemoryCognitionService } from '../services/memory-cognition.service.js';
import { MemoryEnqueueService } from '../services/memory-enqueue.service.js';
import { MemoryOverridesService } from '../services/memory-overrides.service.js';
import { MemorySearchService } from '../services/memory-search.service.js';
import { QdrantClientService } from '../services/qdrant-client.service.js';
import { VectorizeService } from '../services/vectorize.service.js';

@ApeTagsQdrant()
@Controller('qdrant')
export class QdrantController {
  constructor(
    private readonly qdrantClientService: QdrantClientService,
    private readonly memoryRepository: MemoryRepository,
    private readonly memorySearchService: MemorySearchService,
    private readonly memoryCognitionService: MemoryCognitionService,
    private readonly memoryOverrides: MemoryOverridesService,
    private readonly vectorizeService: VectorizeService,
    private readonly ledger: MemoryInsertLedgerRepository,
    private readonly memoryEnqueue: MemoryEnqueueService,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  @Get('status')
  @ApeGetQdrantStatus()
  async status(): Promise<QdrantStatusResponseDto> {
    return this.qdrantClientService.getStatus();
  }

  @Get('memory/cognition')
  @ApeGetQdrantMemoryCognition()
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
      episodeProbeLimit: this.memoryOverrides.getEpisodeProbeLimit(),
    };
  }

  @Get('memory')
  @ApeGetQdrantMemory()
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
  @ApePostQdrantText()
  async sendText(@Body() body: MemorySendTextDto) {
    try {
      const id = await this.vectorizeService.storeRecord({
        memoryPartition: body.memoryPartition ?? body.sessionId,
        sessionId: body.sessionId,
        conversationId: body.conversationId,
        requestId: body.requestId,
        text: body.text,
        tags: body.tags,
      });
      return { accepted: true, id };
    } catch {
      // Feature off or embed/store outage — memory is a background concern.
      return { accepted: false };
    }
  }

  @Delete('text')
  @ApeDeleteQdrantText()
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
  @ApePostQdrantSearchText()
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
      recency: body.recency,
    });
  }

  @Post('search/vector')
  @HttpCode(HttpStatus.OK)
  @ApePostQdrantSearchVector()
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

  @Post('memory/consolidate')
  @HttpCode(HttpStatus.OK)
  @ApePostQdrantConsolidate()
  async consolidate(
    @Body() body: MemoryConsolidateBodyDto,
  ): Promise<MemoryConsolidateResponseDto> {
    const partitions = body.memoryPartition?.trim()
      ? [body.memoryPartition.trim()]
      : (await this.ledger.listPendingPartitions()).map(
          (p) => p.memoryPartition,
        );

    const model = body.model?.trim() || this.config.consolidateModel;
    if (!model)
      throw new BadRequestException(
        'An adjudication model is required — pass "model" or set MEMORY_CONSOLIDATE_MODEL',
      );

    const limit = Math.min(body.limit ?? 100, 500);
    const sweeps: Array<{ memoryPartition: string; pending: number }> = [];
    for (const memoryPartition of partitions) {
      const pending = await this.ledger.countPending(memoryPartition);
      if (pending === 0) continue;
      await this.memoryEnqueue.enqueueConsolidateJob({
        memoryPartition,
        model,
        limit,
        dryRun: body.dryRun === true,
      });
      sweeps.push({ memoryPartition, pending });
    }
    return { accepted: true, sweeps };
  }

  @Delete('memory')
  @ApeDeleteQdrantMemory()
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
