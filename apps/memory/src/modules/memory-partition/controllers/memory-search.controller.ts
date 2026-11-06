import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import {
  ApePostMemorySearchBridges,
  ApePostMemorySearchSynopses,
  ApePostMemorySearchText,
  ApePostMemorySearchTextClusters,
  ApePostMemorySearchVector,
  ApeTagsMemory,
} from '../../qdrant/decorators/openapi/swagger.js';
import type { MemoryPoint } from '../../qdrant/models/memory.model.js';
import { MemorySearchBridgesDto } from '../dtos/memory-search-bridges.dto.js';
import { MemorySearchClustersResponseDto } from '../dtos/memory-search-clusters-response.dto.js';
import { MemorySearchTextDto } from '../dtos/memory-search-text.dto.js';
import { MemorySearchVectorDto } from '../dtos/memory-search-vector.dto.js';
import { MemorySynopsisDto } from '../dtos/memory-synopsis.dto.js';
import { MemorySearchService } from '../services/memory-search.service.js';

/** Text, vector, graph-augmented, synopsis, and bridge search routes. */
@ApeTagsMemory()
@Controller('memory')
export class MemorySearchController {
  constructor(private readonly memorySearchService: MemorySearchService) {}

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

  /** Search cluster synopses across hierarchy levels for cross-cutting context. */
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
}
