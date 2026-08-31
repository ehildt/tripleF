import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';

import { EncyclopediaLedgerRepository } from '../../persistence/services/encyclopedia-ledger.repository.js';
import { MemoryClusterResponseDto } from '../../qdrant/dtos/memory-cluster-response.dto.js';
import { MemoryReflectResponseDto } from '../../qdrant/dtos/memory-reflect-response.dto.js';
import { MemoryEnqueueService } from '../../qdrant/services/memory-enqueue.service.js';
import { MemoryOverridesService } from '../../qdrant/services/memory-overrides.service.js';
import { ENCYCLOPEDIA_CONFIG } from '../constants/encyclopedia.constants.js';
import {
  ApePostEncyclopediaClassify,
  ApePostEncyclopediaCluster,
  ApePostEncyclopediaConsolidate,
  ApePostEncyclopediaReflect,
  ApeTagsEncyclopediaMaintenance,
} from '../decorators/openapi/swagger.js';
import { EncyclopediaClassifyBodyDto } from '../dtos/encyclopedia-classify-body.dto.js';
import { EncyclopediaClusterBodyDto } from '../dtos/encyclopedia-cluster-body.dto.js';
import { EncyclopediaConsolidateBodyDto } from '../dtos/encyclopedia-consolidate-body.dto.js';
import { EncyclopediaConsolidateResponseDto } from '../dtos/encyclopedia-consolidate-response.dto.js';
import { EncyclopediaReflectBodyDto } from '../dtos/encyclopedia-reflect-body.dto.js';
import type { EncyclopediaConfig } from '../models/encyclopedia-config.model.js';

/**
 * The ENCYCLOPEDIA maintenance endpoints, grouped so the pipeline order is
 * visible at a glance. The encyclopedia is a single global scope, and its
 * steps MUST run in dependency order:
 *
 * Encyclopedia pipeline (global):
 *   ① POST /consolidate — deterministic supersede sweep: heal orphaned
 *                         old-hash chunks so only the current document version
 *                         remains.
 *   ② POST /classify    — after supersede settles: label stored documents
 *                         with the source-agnostic category + topic (the
 *                         constellation's category + topic tiers).
 *   ③ POST /reflect     — after labels settle: friction screen over the
 *                         labeled chunks; the loser's chunks are superseded.
 *   ④ POST /cluster     — after the graph settles: detect clusters over the
 *                         link graph (every chunk lands in exactly one) and
 *                         summarize each changed cluster into a title +
 *                         summary (the cluster tier's LLM-written labels).
 *
 * Each step only picks up work the previous step produced (the ledger feeds
 * ①/②, the reflection sweep reads `is_reflected`), so an out-of-order or
 * empty step is a harmless no-op — but firing them in this order converges
 * the encyclopedia in one pass instead of several.
 */
@ApeTagsEncyclopediaMaintenance()
@Controller('encyclopedia')
export class EncyclopediaMaintenanceController {
  constructor(
    private readonly ledger: EncyclopediaLedgerRepository,
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly memoryOverrides: MemoryOverridesService,
    @Inject(ENCYCLOPEDIA_CONFIG) private readonly config: EncyclopediaConfig,
  ) {}

  @Post('consolidate')
  @HttpCode(HttpStatus.OK)
  @ApePostEncyclopediaConsolidate()
  async consolidate(
    @Body() body: EncyclopediaConsolidateBodyDto,
  ): Promise<EncyclopediaConsolidateResponseDto> {
    const pending = await this.ledger.countPending();
    if (pending === 0) return { accepted: true, pending: 0 };
    await this.memoryEnqueue.enqueueEncyclopediaSweep({
      limit: body.limit ?? 100,
      dryRun: body.dryRun === true,
    });
    return { accepted: true, pending };
  }

  @Post('classify')
  @HttpCode(HttpStatus.OK)
  @ApePostEncyclopediaClassify()
  async classify(
    @Body() body: EncyclopediaClassifyBodyDto,
  ): Promise<EncyclopediaConsolidateResponseDto> {
    const model =
      body.model ??
      this.memoryOverrides.getClassifyModel() ??
      this.config.classifyModel;
    if (!model) {
      throw new BadRequestException(
        'Pass a model, set a client override, or set ENCYCLOPEDIA_CLASSIFY_MODEL',
      );
    }
    const pending = await this.ledger.countPendingClassification();
    // Tier-1 snippet urls queue Qdrant-side (missing labels), invisible to the
    // ledger — enqueue even at 0 pending documents; the job no-ops on a fully
    // labeled encyclopedia.
    await this.memoryEnqueue.enqueueEncyclopediaClassify({
      model,
      limit: body.limit,
      dryRun: body.dryRun === true,
    });
    return { accepted: true, pending };
  }

  @Post('reflect')
  @HttpCode(HttpStatus.OK)
  @ApePostEncyclopediaReflect()
  async reflect(
    @Body() body: EncyclopediaReflectBodyDto,
  ): Promise<MemoryReflectResponseDto> {
    const model = body.model?.trim() || this.memoryOverrides.getReflectModel();
    if (!model) {
      throw new BadRequestException(
        'A reflection model is required — pass "model", set a client override, or set MEMORY_REFLECT_MODEL',
      );
    }
    await this.memoryEnqueue.enqueueReflectJob({
      lane: 'encyclopedia',
      scopeKey: 'global',
      model,
      limit: body.limit,
      dryRun: body.dryRun === true,
    });
    return { accepted: true };
  }

  @Post('cluster')
  @HttpCode(HttpStatus.OK)
  @ApePostEncyclopediaCluster()
  async detectClusters(
    @Body() body: EncyclopediaClusterBodyDto,
  ): Promise<MemoryClusterResponseDto> {
    const model = body.model?.trim() || this.memoryOverrides.getClusterModel();
    if (!model) {
      throw new BadRequestException(
        'A cluster model is required — pass "model", set a client override, or set MEMORY_CLUSTER_MODEL',
      );
    }
    await this.memoryEnqueue.enqueueClusterJob({
      lane: 'encyclopedia',
      scopeKey: 'global',
      model,
      minMembers: body.minMembers,
      dryRun: body.dryRun === true,
    });
    return { accepted: true };
  }
}
