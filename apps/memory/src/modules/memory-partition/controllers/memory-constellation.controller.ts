import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import { MemoryClusterRepository } from '../../persistence/services/memory-cluster.repository.js';
import { MemoryMainNodeRepository } from '../../persistence/services/memory-main-node.repository.js';
import {
  ApeGetMemoryClusters,
  ApeGetMemoryFrictions,
  ApeGetMemoryLinks,
  ApeGetMemoryMainNodes,
  ApePostMemoryLinksRecompute,
  ApeTagsMemory,
} from '../../qdrant/decorators/openapi/swagger.js';
import { MemoryGraphRepository } from '../../qdrant/services/memory-graph.repository.js';
import { MemoryLabelRepository } from '../../qdrant/services/memory-label.repository.js';
import { QdrantClientService } from '../../qdrant/services/qdrant-client.service.js';
import { MemoryClusterDto } from '../dtos/memory-cluster.dto.js';
import { MemoryClustersQueryDto } from '../dtos/memory-clusters-query.dto.js';
import { MemoryFrictionDto } from '../dtos/memory-friction.dto.js';
import { MemoryLinkDto } from '../dtos/memory-link.dto.js';
import { MemoryLinksQueryDto } from '../dtos/memory-links-query.dto.js';
import { MemoryLinksRecomputeResponseDto } from '../dtos/memory-links-recompute-response.dto.js';
import { MemoryMainNodeDto } from '../dtos/memory-main-node.dto.js';
import { MemoryVocabularyQueryDto } from '../dtos/memory-vocabulary-query.dto.js';

import type { MemoryVocabularyResult } from './memory-constellation.controller.types.js';

/** Vocabulary, graph, friction, cluster, and main-node constellation routes. */
@ApeTagsMemory()
@Controller('memory')
export class MemoryConstellationController {
  constructor(
    private readonly labelRepository: MemoryLabelRepository,
    private readonly graphRepository: MemoryGraphRepository,
    private readonly clientService: QdrantClientService,
    private readonly clusters: MemoryClusterRepository,
    private readonly mainNodes: MemoryMainNodeRepository,
  ) {}

  @Get('vocabulary')
  async listVocabulary(
    @Query() query: MemoryVocabularyQueryDto,
  ): Promise<MemoryVocabularyResult> {
    const partition = query.memoryPartition;
    if (!partition) return { categories: [], tags: [] };
    const [categories, tags] = await Promise.all([
      this.labelRepository.facetCategories(partition),
      this.labelRepository.facetTags(partition),
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
    return this.graphRepository.listLinks(lane, scopeKey);
  }

  @Get('frictions')
  @ApeGetMemoryFrictions()
  async listMemoryFrictions(
    @Query() query: MemoryLinksQueryDto,
  ): Promise<MemoryFrictionDto[]> {
    const lane = query.memoryPartition ? 'partition' : 'cognition';
    const scopeKey = query.memoryPartition ?? query.memoryCognition;
    if (!scopeKey) return [];
    return this.graphRepository.listFrictions(lane, scopeKey);
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
      this.clientService.collection,
      partition,
    );
  }

  @Get('main-nodes')
  @ApeGetMemoryMainNodes()
  async listMemoryMainNodes(
    @Query() query: MemoryClustersQueryDto,
  ): Promise<MemoryMainNodeDto[]> {
    const partition = query.memoryPartition?.trim();
    if (!partition) return [];
    return this.mainNodes.listByScope(
      'partition',
      this.clientService.collection,
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
    const edges = await this.graphRepository.recomputeLinks(lane, scopeKey);
    return { edges: edges.length };
  }
}
