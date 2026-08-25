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

/** One ledger row to write — the sweep's incremental input and the write-side audit trail. */
interface MemoryInsertLedgerRow {
  memoryPartition: string;
  pointId: string;
  role: 'user' | 'assistant';
  text: string;
  requestId?: string;
}

/** A pending (unswept) ledger row, oldest-first. */
export interface PendingLedgerEntry extends MemoryInsertLedgerRow {
  id: string;
  createdAt: Date;
}

/**
 * Postgres storage for the memory insert ledger — one row per stored fact
 * record (the memory_partition lane in Qdrant), written by the vectorize
 * store step and the memory-partition-remember sync path. `sweptAt` null marks a row
 * pending consolidation; the sweep marks rows swept only after processing
 * them, so a crash mid-run resumes from the oldest unswept row.
 *
 * The table is owned by the main server (its migrations create it); this app
 * consumes it with its own generated client — no migrations run here.
 */
@Injectable()
export class MemoryInsertLedgerRepository
  implements OnModuleInit, OnModuleDestroy
{
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

  /** Append one row per stored point. No-op on an empty batch. */
  async insertMany(rows: MemoryInsertLedgerRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.prisma.memoryInsertLedger.createMany({ data: rows });
  }

  /** Oldest-first pending rows of one partition, capped at `limit`. */
  async listPending(
    memoryPartition: string,
    limit: number,
  ): Promise<PendingLedgerEntry[]> {
    const rows = await this.prisma.memoryInsertLedger.findMany({
      where: { memoryPartition, sweptAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      memoryPartition: row.memoryPartition,
      pointId: row.pointId,
      role: row.role as MemoryInsertLedgerRow['role'],
      text: row.text,
      requestId: row.requestId ?? undefined,
      createdAt: row.createdAt,
    }));
  }

  /** Distinct partitions with pending rows, plus their pending counts. */
  async listPendingPartitions(): Promise<
    Array<{ memoryPartition: string; pending: number }>
  > {
    const groups = await this.prisma.memoryInsertLedger.groupBy({
      by: ['memoryPartition'],
      where: { sweptAt: null },
      _count: { _all: true },
    });
    return groups.map((group) => ({
      memoryPartition: group.memoryPartition,
      pending: group._count._all,
    }));
  }

  /** Mark rows swept (processed by the consolidation sweep). No-op on empty. */
  async markSwept(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.memoryInsertLedger.updateMany({
      where: { id: { in: ids } },
      data: { sweptAt: new Date() },
    });
  }

  /** Pending count of one partition — the auto-trigger threshold check. */
  async countPending(memoryPartition: string): Promise<number> {
    return this.prisma.memoryInsertLedger.count({
      where: { memoryPartition, sweptAt: null },
    });
  }
}
