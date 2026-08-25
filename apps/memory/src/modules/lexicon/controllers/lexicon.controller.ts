import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import { LexiconLedgerRepository } from '../../persistence/services/lexicon-ledger.repository.js';
import { MemoryLinkDto } from '../../qdrant/dtos/memory-link.dto.js';
import { MemoryLinksRecomputeResponseDto } from '../../qdrant/dtos/memory-links-recompute-response.dto.js';
import { LexiconRepository } from '../../qdrant/services/lexicon.repository.js';
import { MemoryEnqueueService } from '../../qdrant/services/memory-enqueue.service.js';
import {
  ApeGetLexicon,
  ApeGetLexiconLinks,
  ApePostLexiconConsolidate,
  ApePostLexiconIndex,
  ApePostLexiconLinksRecompute,
  ApePostLexiconSelect,
  ApeTagsLexicon,
} from '../decorators/openapi/swagger.js';
import { LexiconChunkDto } from '../dtos/lexicon-chunk.dto.js';
import { LexiconConsolidateBodyDto } from '../dtos/lexicon-consolidate-body.dto.js';
import { LexiconConsolidateResponseDto } from '../dtos/lexicon-consolidate-response.dto.js';
import { LexiconIndexDto } from '../dtos/lexicon-index.dto.js';
import { LexiconListQueryDto } from '../dtos/lexicon-list-query.dto.js';
import { LexiconSelectDto } from '../dtos/lexicon-select.dto.js';
import { LexiconSelectService } from '../services/lexicon-select.service.js';
import { LexiconStoreService } from '../services/lexicon-store.service.js';

@ApeTagsLexicon()
@Controller('lexicon')
export class LexiconController {
  constructor(
    private readonly lexiconSelect: LexiconSelectService,
    private readonly lexiconStore: LexiconStoreService,
    private readonly lexiconRepository: LexiconRepository,
    private readonly ledger: LexiconLedgerRepository,
    private readonly memoryEnqueue: MemoryEnqueueService,
  ) {}

  @Get()
  @ApeGetLexicon()
  async list(@Query() query: LexiconListQueryDto): Promise<LexiconChunkDto[]> {
    return this.lexiconRepository.listChunks({
      domain: query.domain,
      partitionScope: query.partitionScope,
      limit: query.limit,
    });
  }

  @Get('links')
  @ApeGetLexiconLinks()
  async listLinks(): Promise<MemoryLinkDto[]> {
    return this.lexiconRepository.listLinks();
  }

  @Post('links/recompute')
  @HttpCode(HttpStatus.OK)
  @ApePostLexiconLinksRecompute()
  async recomputeLinks(): Promise<MemoryLinksRecomputeResponseDto> {
    const edges = await this.lexiconRepository.recomputeLinks();
    return { edges: edges.length };
  }

  @Post('select')
  @HttpCode(HttpStatus.OK)
  @ApePostLexiconSelect()
  async select(@Body() body: LexiconSelectDto) {
    return this.lexiconSelect.select(body);
  }

  @Post('index')
  @HttpCode(HttpStatus.OK)
  @ApePostLexiconIndex()
  async index(@Body() body: LexiconIndexDto) {
    const outcome = await this.lexiconStore.persistDocuments(
      body.documents,
      body.partitionScope ?? 'global',
    );
    return { storedDocs: outcome.storedDocs, reusedDocs: outcome.reusedDocs };
  }

  @Post('consolidate')
  @HttpCode(HttpStatus.OK)
  @ApePostLexiconConsolidate()
  async consolidate(
    @Body() body: LexiconConsolidateBodyDto,
  ): Promise<LexiconConsolidateResponseDto> {
    const pending = await this.ledger.countPending();
    if (pending === 0) return { accepted: true, pending: 0 };
    await this.memoryEnqueue.enqueueLexiconSweep({
      limit: Math.min(body.limit ?? 100, 500),
      dryRun: body.dryRun === true,
    });
    return { accepted: true, pending };
  }
}
