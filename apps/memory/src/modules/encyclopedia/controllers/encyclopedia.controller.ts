import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import { MemoryClusterRepository } from '../../persistence/services/memory-cluster.repository.js';
import { MemoryClusterDto } from '../../qdrant/dtos/memory-cluster.dto.js';
import { MemoryFrictionDto } from '../../qdrant/dtos/memory-friction.dto.js';
import { MemoryLinkDto } from '../../qdrant/dtos/memory-link.dto.js';
import { MemoryLinksRecomputeResponseDto } from '../../qdrant/dtos/memory-links-recompute-response.dto.js';
import { EncyclopediaRepository } from '../../qdrant/services/encyclopedia.repository.js';
import {
  ApeGetEncyclopedia,
  ApeGetEncyclopediaClusters,
  ApeGetEncyclopediaFrictions,
  ApeGetEncyclopediaLinks,
  ApePostEncyclopediaDocument,
  ApePostEncyclopediaIndex,
  ApePostEncyclopediaLinksRecompute,
  ApePostEncyclopediaSearch,
  ApePostEncyclopediaSelect,
  ApeTagsEncyclopedia,
} from '../decorators/openapi/swagger.js';
import { EncyclopediaChunkDto } from '../dtos/encyclopedia-chunk.dto.js';
import { EncyclopediaDocumentDto } from '../dtos/encyclopedia-document.dto.js';
import { EncyclopediaIndexDto } from '../dtos/encyclopedia-index.dto.js';
import { EncyclopediaListQueryDto } from '../dtos/encyclopedia-list-query.dto.js';
import { EncyclopediaSearchDto } from '../dtos/encyclopedia-search.dto.js';
import { EncyclopediaSelectDto } from '../dtos/encyclopedia-select.dto.js';
import { EncyclopediaQueryService } from '../services/encyclopedia-query.service.js';
import { EncyclopediaSelectService } from '../services/encyclopedia-select.service.js';
import { EncyclopediaStoreService } from '../services/encyclopedia-store.service.js';

@ApeTagsEncyclopedia()
@Controller('encyclopedia')
export class EncyclopediaController {
  constructor(
    private readonly encyclopediaSelect: EncyclopediaSelectService,
    private readonly encyclopediaStore: EncyclopediaStoreService,
    private readonly encyclopediaQuery: EncyclopediaQueryService,
    private readonly encyclopediaRepository: EncyclopediaRepository,
    private readonly clusters: MemoryClusterRepository,
  ) {}

  @Get()
  @ApeGetEncyclopedia()
  async list(
    @Query() query: EncyclopediaListQueryDto,
  ): Promise<EncyclopediaChunkDto[]> {
    return this.encyclopediaRepository.listChunks({
      domain: query.domain,
      partitionScope: query.partitionScope,
      limit: query.limit,
    });
  }

  @Get('links')
  @ApeGetEncyclopediaLinks()
  async listLinks(): Promise<MemoryLinkDto[]> {
    return this.encyclopediaRepository.listLinks();
  }

  @Get('frictions')
  @ApeGetEncyclopediaFrictions()
  async listFrictions(): Promise<MemoryFrictionDto[]> {
    return this.encyclopediaRepository.listFrictions();
  }

  @Get('clusters')
  @ApeGetEncyclopediaClusters()
  async listClusters(): Promise<MemoryClusterDto[]> {
    return this.clusters.listByScope(
      'encyclopedia',
      this.encyclopediaRepository.collection,
      'global',
    );
  }

  @Post('links/recompute')
  @HttpCode(HttpStatus.OK)
  @ApePostEncyclopediaLinksRecompute()
  async recomputeLinks(): Promise<MemoryLinksRecomputeResponseDto> {
    const edges = await this.encyclopediaRepository.recomputeLinks();
    return { edges: edges.length };
  }

  @Post('select')
  @HttpCode(HttpStatus.OK)
  @ApePostEncyclopediaSelect()
  async select(@Body() body: EncyclopediaSelectDto) {
    return this.encyclopediaSelect.select(body);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApePostEncyclopediaSearch()
  async search(@Body() body: EncyclopediaSearchDto) {
    return this.encyclopediaQuery.search(body);
  }

  @Post('document')
  @HttpCode(HttpStatus.OK)
  @ApePostEncyclopediaDocument()
  async readDocument(@Body() body: EncyclopediaDocumentDto) {
    return this.encyclopediaQuery.readDocument(body);
  }

  @Post('index')
  @HttpCode(HttpStatus.OK)
  @ApePostEncyclopediaIndex()
  async index(@Body() body: EncyclopediaIndexDto) {
    const outcome = await this.encyclopediaStore.persistDocuments(
      body.documents,
      body.partitionScope ?? 'global',
      undefined,
      true,
    );
    return {
      storedDocs: outcome.storedDocs,
      reusedDocs: outcome.reusedDocs,
      rejectedDocs: outcome.rejectedDocs,
    };
  }
}
