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

import { MemoryCognitionService } from '../../memory-cognition/services/memory-cognition.service.js';
import { MemoryClusterRepository } from '../../persistence/services/memory-cluster.repository.js';
import {
  ApeDeleteMemory,
  ApeDeleteMemoryText,
  ApeGetMemoryClusters,
  ApeGetMemoryFrictions,
  ApeGetMemoryLinks,
  ApeGetMemoryList,
  ApePostMemoryLinksRecompute,
  ApePostMemorySearchBridges,
  ApePostMemorySearchSynopses,
  ApePostMemorySearchText,
  ApePostMemorySearchTextClusters,
  ApePostMemorySearchVector,
  ApePostMemoryText,
  ApeTagsMemory,
} from '../../qdrant/decorators/openapi/swagger.js';
import type { MemoryPoint } from '../../qdrant/models/memory.model.js';
import { MemoryRepository } from '../../qdrant/services/memory.repository.js';
import { MemoryClusterDto } from '../dtos/memory-cluster.dto.js';
import { MemoryClustersQueryDto } from '../dtos/memory-clusters-query.dto.js';
import { MemoryDeleteQueryDto } from '../dtos/memory-delete-query.dto.js';
import { MemoryDeleteResponseDto } from '../dtos/memory-delete-response.dto.js';
import { MemoryFrictionDto } from '../dtos/memory-friction.dto.js';
import { MemoryLinkDto } from '../dtos/memory-link.dto.js';
import { MemoryLinksQueryDto } from '../dtos/memory-links-query.dto.js';
import { MemoryLinksRecomputeResponseDto } from '../dtos/memory-links-recompute-response.dto.js';
import { MemoryListQueryDto } from '../dtos/memory-list-query.dto.js';
import { MemoryPruneQueryDto } from '../dtos/memory-prune-query.dto.js';
import { MemoryPruneResponseDto } from '../dtos/memory-prune-response.dto.js';
import { MemorySearchBridgesDto } from '../dtos/memory-search-bridges.dto.js';
import { MemorySearchClustersResponseDto } from '../dtos/memory-search-clusters-response.dto.js';
import { MemorySearchTextDto } from '../dtos/memory-search-text.dto.js';
import { MemorySearchVectorDto } from '../dtos/memory-search-vector.dto.js';
import { MemorySendTextDto } from '../dtos/memory-send-text.dto.js';
import { MemorySynopsisDto } from '../dtos/memory-synopsis.dto.js';
import { MemoryVocabularyQueryDto } from '../dtos/memory-vocabulary-query.dto.js';
import { MemorySearchService } from '../services/memory-search.service.js';
import { VectorizeService } from '../services/vectorize.service.js';

/**
 * The partition lane's read/write REST surface: list/search/delete memory points,
 * the link/friction/cluster graph reads, and the text ingest/delete entry.
 */
@ApeTagsMemory()
@Controller('memory')
export class MemoryPartitionController {
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly memorySearchService: MemorySearchService,
    private readonly memoryCognitionService: MemoryCognitionService,
    private readonly vectorizeService: VectorizeService,
    private readonly clusters: MemoryClusterRepository,
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

  @Get('vocabulary')
  async listVocabulary(
    @Query() query: MemoryVocabularyQueryDto,
  ): Promise<{ categories: string[]; tags: string[] }> {
    const partition = query.memoryPartition;
    if (!partition) return { categories: [], tags: [] };
    const [categories, tags] = await Promise.all([
      this.memoryRepository.facetCategories(partition),
      this.memoryRepository.facetTags(partition),
    ]);
    return {
      categories: categories.map((entry) => entry.value),
      tags: tags.map((entry) => entry.value),
    };
  }

  @Get('links')
  @ApeGetMemoryLinks()
  async listMemoryLinks(
    @Query() query: MemoryLinksQueryDto,
  ): Promise<MemoryLinkDto[]> {
    const lane = query.memoryPartition ? 'partition' : 'cognition';
    const scopeKey = query.memoryPartition ?? query.memoryCognition;
    if (!scopeKey) return [];
    return this.memoryRepository.listLinks(lane, scopeKey);
  }

  @Get('frictions')
  @ApeGetMemoryFrictions()
  async listMemoryFrictions(
    @Query() query: MemoryLinksQueryDto,
  ): Promise<MemoryFrictionDto[]> {
    const lane = query.memoryPartition ? 'partition' : 'cognition';
    const scopeKey = query.memoryPartition ?? query.memoryCognition;
    if (!scopeKey) return [];
    return this.memoryRepository.listFrictions(lane, scopeKey);
  }

  @Get('clusters')
  @ApeGetMemoryClusters()
  async listMemoryClusters(
    @Query() query: MemoryClustersQueryDto,
  ): Promise<MemoryClusterDto[]> {
    const partition = query.memoryPartition?.trim();
    if (!partition) return [];
    return this.clusters.listByScope(
      'partition',
      this.memoryRepository.collection,
      partition,
    );
  }

  @Post('links/recompute')
  @HttpCode(HttpStatus.OK)
  @ApePostMemoryLinksRecompute()
  async recomputeMemoryLinks(
    @Query() query: MemoryLinksQueryDto,
  ): Promise<MemoryLinksRecomputeResponseDto> {
    const lane = query.memoryPartition ? 'partition' : 'cognition';
    const scopeKey = query.memoryPartition ?? query.memoryCognition;
    if (!scopeKey)
      throw new BadRequestException('Pass memoryPartition or memoryCognition');
    const edges = await this.memoryRepository.recomputeLinks(lane, scopeKey);
    return { edges: edges.length };
  }

  @Post('text')
  @HttpCode(HttpStatus.OK)
  @ApePostMemoryText()
  async sendText(@Body() body: MemorySendTextDto) {
    try {
      const id = await this.vectorizeService.storeRecord({
        memoryPartition: body.memoryPartition ?? body.sessionId,
        sessionId: body.sessionId,
        conversationId: body.conversationId,
        requestId: body.requestId,
        text: body.text,
        tags: body.tags,
        category: body.category,
      });
      return { accepted: true, id };
    } catch {
      // Feature off or embed/store outage — memory is a background concern.
      return { accepted: false };
    }
  }

  @Delete('text')
  @ApeDeleteMemoryText()
  async deleteText(
    @Query() query: MemoryDeleteQueryDto,
  ): Promise<MemoryDeleteResponseDto> {
    const partition = query.memoryPartition ?? query.sessionId;
    if (!partition) {
      throw new BadRequestException(
        'Deletes are never anonymous: pass memoryPartition or sessionId',
      );
    }

    // Cognition mode: WITH a matcher (verbatim insight text and/or a profile
    // path) this is the targeted per-item delete (memory-cognition-delete
    // tool); WITHOUT one it wipes the AI's whole understanding of the user.
    if (query.cognition === true) {
      if (query.text || query.path) {
        return await this.memoryCognitionService.deleteCognitionRecords({
          memoryCognition: partition,
          text: query.text,
          path: query.path,
        });
      }
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
      // wipes have their own endpoint (DELETE /memory).
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
  @ApePostMemorySearchText()
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

  @Post('search/text/clusters')
  @HttpCode(HttpStatus.OK)
  @ApePostMemorySearchTextClusters()
  async searchByTextWithClusters(
    @Body() body: MemorySearchTextDto,
  ): Promise<MemorySearchClustersResponseDto> {
    return this.memorySearchService.searchByTextWithClusters({
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

  /**
   * The Raptor probe read path: semantic search over one scope's cluster
   * synopses (community summaries at every hierarchy level, collapsed into
   * one kNN) — the interpret-time cross-cutting context layer.
   */
  @Post('search/synopses')
  @HttpCode(HttpStatus.OK)
  @ApePostMemorySearchSynopses()
  async searchSynopses(
    @Body() body: MemorySearchTextDto,
  ): Promise<MemorySynopsisDto[]> {
    return this.memorySearchService.searchSynopses({
      memoryPartition: body.memoryPartition,
      text: body.text,
      limit: body.limit,
    });
  }

  @Post('search/vector')
  @HttpCode(HttpStatus.OK)
  @ApePostMemorySearchVector()
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

  @Post('search/bridges')
  @HttpCode(HttpStatus.OK)
  @ApePostMemorySearchBridges()
  async searchBridges(
    @Body() body: MemorySearchBridgesDto,
  ): Promise<MemoryPoint[]> {
    return this.memorySearchService.searchBridges({
      memoryPartition: body.memoryPartition,
      text: body.text,
      limit: body.limit,
    });
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
