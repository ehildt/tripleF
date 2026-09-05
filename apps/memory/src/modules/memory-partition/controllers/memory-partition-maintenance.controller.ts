import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';

import { MemoryInsertLedgerRepository } from '../../persistence/services/memory-insert-ledger.repository.js';
import {
  ApePostPartitionCluster,
  ApePostPartitionConsolidate,
  ApePostPartitionConviction,
  ApePostPartitionReconcile,
  ApePostPartitionReflect,
  ApePostPartitionRelink,
  ApeTagsPartitionMaintenance,
} from '../../qdrant/decorators/openapi/swagger.js';
import { MemoryEnqueueService } from '../../qdrant/services/memory-enqueue.service.js';
import { MemoryOverridesService } from '../../qdrant/services/memory-overrides.service.js';
import { MemoryClusterResponseDto } from '../dtos/memory-cluster-response.dto.js';
import { MemoryConsolidateBodyDto } from '../dtos/memory-consolidate-body.dto.js';
import { MemoryConsolidateResponseDto } from '../dtos/memory-consolidate-response.dto.js';
import { MemoryConvictionBodyDto } from '../dtos/memory-conviction-body.dto.js';
import { MemoryConvictionResponseDto } from '../dtos/memory-conviction-response.dto.js';
import { MemoryPartitionClusterBodyDto } from '../dtos/memory-partition-cluster-body.dto.js';
import { MemoryPartitionReflectBodyDto } from '../dtos/memory-partition-reflect-body.dto.js';
import { MemoryReflectResponseDto } from '../dtos/memory-reflect-response.dto.js';
import { MemoryRelinkQueryDto } from '../dtos/memory-relink-query.dto.js';
import { MemoryRelinkResponseDto } from '../dtos/memory-relink-response.dto.js';
import { MemoryTaxonomyReconcileBodyDto } from '../dtos/memory-taxonomy-reconcile-body.dto.js';

/**
 * The PARTITION maintenance endpoints, grouped so the pipeline order is
 * visible at a glance. These are heavy LLM sweeps triggered manually (or
 * chained by the queue's auto-triggers); the steps MUST run in dependency
 * order:
 *
 * Partition fact pipeline (per memoryPartition):
 *   ① POST /consolidate — dedupe/merge pending inserts (keep/redundant/merge).
 *   ② POST /relink      — after merges settle: collapse category variants,
 *                         dedupe per category, write topical (suggested) edges.
 *   ③ POST /reflect     — after edges settle: friction screen; the loser's
 *                         facts are superseded.
 *   ④ POST /conviction  — after reflection: synthesize higher-level
 *                         convictions/bridges from the curated (reflected)
 *                         facts — convictions (cognition lane) and bridges
 *                         (partition lane).
 *   ⑤ POST /cluster     — after the graph settles: detect clusters over the
 *                         link graph (every fact lands in exactly one) and
 *                         summarize each changed cluster into a title +
 *                         summary (the cluster tier's LLM-written labels).
 *
 * Each step's processor only picks up rows the previous step produced, so an
 * out-of-order or empty step is a harmless no-op — but firing them in this
 * order converges a partition in one pass instead of several.
 */
@ApeTagsPartitionMaintenance()
@Controller('memory')
export class MemoryPartitionMaintenanceController {
  constructor(
    private readonly ledger: MemoryInsertLedgerRepository,
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly memoryOverrides: MemoryOverridesService,
  ) {}

  @Post('consolidate')
  @HttpCode(HttpStatus.OK)
  @ApePostPartitionConsolidate()
  async consolidate(
    @Body() body: MemoryConsolidateBodyDto,
  ): Promise<MemoryConsolidateResponseDto> {
    const partitions = body.memoryPartition?.trim()
      ? [body.memoryPartition.trim()]
      : (await this.ledger.listPendingPartitions()).map(
          (p) => p.memoryPartition,
        );

    const model =
      body.model?.trim() || this.memoryOverrides.getConsolidateModel();
    if (!model)
      throw new BadRequestException(
        'An adjudication model is required — pass "model", set a client override, or set MEMORY_CONSOLIDATE_MODEL',
      );

    const limit = body.limit ?? 100;
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

  @Post('relink')
  @HttpCode(HttpStatus.OK)
  @ApePostPartitionRelink()
  async relinkMemory(
    @Query() query: MemoryRelinkQueryDto,
  ): Promise<MemoryRelinkResponseDto> {
    const memoryPartition = query.memoryPartition?.trim();
    if (!memoryPartition) {
      throw new BadRequestException('memoryPartition is required');
    }
    const model =
      query.model?.trim() || this.memoryOverrides.getConsolidateModel();
    if (!model) {
      throw new BadRequestException(
        'An adjudication model is required — pass "model", set a client override, or set MEMORY_CONSOLIDATE_MODEL',
      );
    }
    await this.memoryEnqueue.enqueueRelinkJob({
      memoryPartition,
      model,
      limit: query.limit,
      maxPasses: query.maxPasses,
      enrich: query.enrich === true,
      dryRun: query.dryRun === true,
    });
    return { accepted: true };
  }

  @Post('reconcile')
  @HttpCode(HttpStatus.OK)
  @ApePostPartitionReconcile()
  async reconcileTaxonomy(
    @Body() body: MemoryTaxonomyReconcileBodyDto,
  ): Promise<MemoryRelinkResponseDto> {
    const memoryPartition = body.memoryPartition.trim();
    if (!memoryPartition) {
      throw new BadRequestException('memoryPartition is required');
    }
    const model =
      body.model?.trim() || this.memoryOverrides.getConsolidateModel();
    if (!model) {
      throw new BadRequestException(
        'A reconcile model is required — pass "model", set a client override, or set MEMORY_CONSOLIDATE_MODEL',
      );
    }
    await this.memoryEnqueue.enqueueTaxonomyReconcileJob({
      lane: 'partition',
      scopeKey: memoryPartition,
      model,
      limit: body.limit,
      dryRun: body.dryRun === true,
    });
    return { accepted: true };
  }

  @Post('reflect')
  @HttpCode(HttpStatus.OK)
  @ApePostPartitionReflect()
  async reflect(
    @Body() body: MemoryPartitionReflectBodyDto,
  ): Promise<MemoryReflectResponseDto> {
    const memoryPartition = body.memoryPartition.trim();
    if (!memoryPartition) {
      throw new BadRequestException('memoryPartition is required');
    }
    const model = body.model?.trim() || this.memoryOverrides.getReflectModel();
    if (!model) {
      throw new BadRequestException(
        'A reflection model is required — pass "model", set a client override, or set MEMORY_REFLECT_MODEL',
      );
    }
    await this.memoryEnqueue.enqueueReflectJob({
      lane: 'partition',
      scopeKey: memoryPartition,
      model,
      limit: body.limit,
      dryRun: body.dryRun === true,
    });
    return { accepted: true };
  }

  @Post('conviction')
  @HttpCode(HttpStatus.OK)
  @ApePostPartitionConviction()
  async synthesizeConvictions(
    @Body() body: MemoryConvictionBodyDto,
  ): Promise<MemoryConvictionResponseDto> {
    const memoryPartition = body.memoryPartition?.trim();
    if (!memoryPartition) {
      throw new BadRequestException('memoryPartition is required');
    }
    const model =
      body.model?.trim() || this.memoryOverrides.getConvictionModel();
    if (!model) {
      throw new BadRequestException(
        'A conviction model is required — pass "model", set a client override, or set MEMORY_CONVICTION_MODEL',
      );
    }
    await this.memoryEnqueue.enqueueConvictionJob({
      memoryPartition,
      memoryCognition: body.memoryCognition?.trim() || undefined,
      model,
      limit: body.limit,
      maxConvictionsPerCluster: body.maxConvictionsPerCluster,
      dryRun: body.dryRun === true,
    });
    return { accepted: true };
  }

  @Post('cluster')
  @HttpCode(HttpStatus.OK)
  @ApePostPartitionCluster()
  async detectClusters(
    @Body() body: MemoryPartitionClusterBodyDto,
  ): Promise<MemoryClusterResponseDto> {
    const memoryPartition = body.memoryPartition.trim();
    if (!memoryPartition) {
      throw new BadRequestException('memoryPartition is required');
    }
    const model = body.model?.trim() || this.memoryOverrides.getClusterModel();
    if (!model) {
      throw new BadRequestException(
        'A cluster model is required — pass "model", set a client override, or set MEMORY_CLUSTER_MODEL',
      );
    }
    await this.memoryEnqueue.enqueueClusterJob({
      lane: 'partition',
      scopeKey: memoryPartition,
      model,
      minMembers: body.minMembers,
      dryRun: body.dryRun === true,
    });
    return { accepted: true };
  }
}
