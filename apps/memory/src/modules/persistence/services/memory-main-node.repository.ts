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

import { mapMainNodeRowToRecord } from './helpers/map-main-node-row-to-record.helper.js';
import type {
  MemoryMainNodeRecord,
  MemoryMainNodeRow,
} from './memory-main-node.repository.types.js';

/**
 * Postgres storage for the title-tier main nodes — one row per topic blob
 * (the grouping the constellation draws around its leafs: partition facts by
 * subject/tag, encyclopedia chunks by document title/domain), carrying the
 * LLM-written summary of the attached leafs. Written by the memory-cluster
 * job's group-summary pass with the same drift-aware fingerprint contract as
 * the detected clusters: unchanged leaf sets keep their stored summary.
 *
 * The table is owned by the main server (its migrations create it); this app
 * consumes it with its own generated client — no migrations run here.
 */
@Injectable()
export class MemoryMainNodeRepository implements OnModuleInit, OnModuleDestroy {
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

  /** Main nodes of one scope, largest first. */
  async listByScope(
    lane: MemoryLane,
    collection: string,
    scopeKey: string,
  ): Promise<MemoryMainNodeRecord[]> {
    const rows = await this.prisma.memoryMainNode.findMany({
      where: { lane, collection, scopeKey },
      orderBy: { memberCount: 'desc' },
    });
    return rows.map(mapMainNodeRowToRecord);
  }

  /**
   * Atomically replace a scope's main nodes: drop the old rows, insert the
   * new set. Fingerprint-stable groups carry their summary over (the job
   * re-inserts them unchanged), so the replace is a no-op for them.
   */
  async replaceScope(
    lane: MemoryLane,
    collection: string,
    scopeKey: string,
    rows: MemoryMainNodeRow[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.memoryMainNode.deleteMany({
        where: { lane, collection, scopeKey },
      }),
      this.prisma.memoryMainNode.createMany({
        data: rows,
        skipDuplicates: true,
      }),
    ]);
  }
}
