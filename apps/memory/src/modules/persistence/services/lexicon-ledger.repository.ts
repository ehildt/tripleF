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
interface LexiconInsertLedgerRow {
  url: string;
  contentHash: string;
  chunkCount: number;
  partitionScope: string;
  title?: string;
  requestId?: string;
}

/** A pending (unswept) ledger row, oldest-first. */
interface PendingLexiconLedgerEntry extends LexiconInsertLedgerRow {
  id: string;
  createdAt: Date;
}

/**
 * Postgres storage for the lexicon insert ledger — one row per stored
 * DOCUMENT (url + content hash), written by the lexicon select-persist path.
 * `sweptAt` null marks a row pending the deterministic supersede sweep; the
 * sweep marks rows swept only after processing them, so a crash mid-run
 * resumes from the oldest unswept row.
 *
 * The table is owned by the main server (its migrations create it); this app
 * consumes it with its own generated client — no migrations run here.
 */
@Injectable()
export class LexiconLedgerRepository implements OnModuleInit, OnModuleDestroy {
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

  /** Append one row per stored document. No-op on an empty batch. */
  async insertMany(rows: LexiconInsertLedgerRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.prisma.memoryLexiconInsertLedger.createMany({ data: rows });
  }

  /** Oldest-first pending rows, capped at `limit` (global — not partition-scoped). */
  async listPending(limit: number): Promise<PendingLexiconLedgerEntry[]> {
    const rows = await this.prisma.memoryLexiconInsertLedger.findMany({
      where: { sweptAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      contentHash: row.contentHash,
      chunkCount: row.chunkCount,
      partitionScope: row.partitionScope,
      title: row.title ?? undefined,
      requestId: row.requestId ?? undefined,
      createdAt: row.createdAt,
    }));
  }

  /** Mark rows swept (processed by the supersede sweep). No-op on empty. */
  async markSwept(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.memoryLexiconInsertLedger.updateMany({
      where: { id: { in: ids } },
      data: { sweptAt: new Date() },
    });
  }

  /** Pending count — the auto-trigger threshold check. */
  async countPending(): Promise<number> {
    return this.prisma.memoryLexiconInsertLedger.count({
      where: { sweptAt: null },
    });
  }
}
