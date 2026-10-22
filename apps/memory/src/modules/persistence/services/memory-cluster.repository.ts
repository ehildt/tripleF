import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../generated/prisma/client.js';
import type { PostgresConfig } from '../../postgres/configs/postgres-config.adapter.js';
import { POSTGRES_CONFIG } from '../../postgres/constants/postgres.constants.js';
import type { MemoryLane } from '../constants/memory-lane.constant.js';

import { mapClusterRowToRecord } from './helpers/map-cluster-row-to-record.helper.js';
import type {
  MemoryClusterRecord,
  MemoryClusterRow,
} from './memory-cluster.repository.types.js';

/**
 * Postgres storage for the detected memory clusters — one row per cluster
 * of related Qdrant points, discovered by the memory-cluster job over the
 * link graph and summarized by an LLM. Scoped like the link graph so the
 * dashboard and retrieval read one space's clusters with zero Qdrant
 * round-trips.
 *
 * The table is owned by the main server (its migrations create it); this app
 * consumes it with its own generated client — no migrations run here.
 */
@Injectable()
export class MemoryClusterRepository implements OnModuleInit, OnModuleDestroy {
  private _prisma: PrismaClient | null = null;

  constructor(
    @Inject(POSTGRES_CONFIG)
    private readonly _config: PostgresConfig,
  ) {}

  get prisma() {
    return this._prisma as PrismaClient;
  }

  async onModuleInit() {
    const adapter = new PrismaPg({
      connectionString: this._config.url,
    });
    this._prisma = new PrismaClient({ adapter });
  }

  async onModuleDestroy() {
    await this._prisma?.$disconnect();
    this._prisma = null;
  }

  /** Clusters of one scope, largest first. */
  async listByScope(
    lane: MemoryLane,
    collection: string,
    scopeKey: string,
  ): Promise<MemoryClusterRecord[]> {
    const rows = await this.prisma.memoryCluster.findMany({
      where: { lane, collection, scopeKey },
      orderBy: { memberCount: 'desc' },
    });
    return rows.map(mapClusterRowToRecord);
  }

  /** Clusters by id — the retrieval attach lookup (hit cluster_id → row). */
  async findByIds(ids: string[]): Promise<MemoryClusterRecord[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.memoryCluster.findMany({
      where: { id: { in: ids } },
    });
    return rows.map(mapClusterRowToRecord);
  }

  /**
   * Atomically replace a scope's clusters: drop the old rows, insert the
   * new set. The job recomputes the full scope each run (MS GraphRAG's own
   * model) but only re-summarizes changed fingerprints — unchanged rows are
   * carried over and re-inserted here, so the replace is a no-op for them.
   */
  async replaceScope(
    lane: MemoryLane,
    collection: string,
    scopeKey: string,
    rows: MemoryClusterRow[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.memoryCluster.deleteMany({
        where: { lane, collection, scopeKey },
      }),
      this.prisma.memoryCluster.createMany({
        data: rows,
        skipDuplicates: true,
      }),
    ]);
  }

  /** Drop every cluster of one scope (full wipe). */
  async deleteByScope(
    lane: MemoryLane,
    collection: string,
    scopeKey: string,
  ): Promise<void> {
    await this.prisma.memoryCluster.deleteMany({
      where: { lane, collection, scopeKey },
    });
  }
}
