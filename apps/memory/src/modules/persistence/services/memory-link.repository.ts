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

/** The three constellation lanes — one per memory layer. */
export type MemoryLinkLane = 'partition' | 'cognition' | 'lexicon';

/**
 * Edge kind: `semantic` edges are the enforced kNN links written by the
 * store paths; `topical` edges are suggestions written by the relink job
 * (related-but-not-enforced — recall ignores them, the dashboard may render
 * them faintly). One edge per point pair: the unique constraint keeps a
 * single row, and semantic wins when both would apply.
 */
export type MemoryLinkKind = 'semantic' | 'topical';

/** One undirected edge read back for the dashboard. */
export interface MemoryLinkEdge {
  source: string;
  target: string;
  score: number;
  kind: MemoryLinkKind;
}

/** One edge row to write (canonical source < target ordering). */
export interface MemoryLinkRow {
  lane: MemoryLinkLane;
  collection: string;
  scopeKey: string;
  source: string;
  target: string;
  score: number;
  kind: MemoryLinkKind;
}

/**
 * Postgres storage for the precomputed constellation link graph — one row
 * per undirected edge between two Qdrant points. Written incrementally by
 * the store paths and cascaded on delete; the dashboard reads a ready graph
 * with zero Qdrant round-trips.
 *
 * The table is owned by the main server (its migrations create it); this app
 * consumes it with its own generated client — no migrations run here.
 */
@Injectable()
export class MemoryLinkRepository implements OnModuleInit, OnModuleDestroy {
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

  /** Insert edges, skipping exact duplicates (idempotent on retry). */
  async upsertEdges(rows: MemoryLinkRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.prisma.memoryLink.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }

  /** Strongest-first edges of one scope, capped at `limit`. */
  async listEdges(
    lane: MemoryLinkLane,
    collection: string,
    scopeKey: string,
    limit: number,
  ): Promise<MemoryLinkEdge[]> {
    const rows = await this.prisma.memoryLink.findMany({
      where: { lane, collection, scopeKey },
      orderBy: { score: 'desc' },
      take: limit,
    });
    return rows.map((row) => ({
      source: row.source,
      target: row.target,
      score: row.score,
      kind: row.kind as MemoryLinkKind,
    }));
  }

  /** Edge count of one scope — the lazy-backfill trigger check. */
  async countForScope(
    lane: MemoryLinkLane,
    collection: string,
    scopeKey: string,
  ): Promise<number> {
    return this.prisma.memoryLink.count({
      where: { lane, collection, scopeKey },
    });
  }

  /** Drop every edge touching any of the given point ids (delete cascade). */
  async deleteByPointIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.memoryLink.deleteMany({
      where: { OR: [{ source: { in: ids } }, { target: { in: ids } }] },
    });
  }

  /** Drop every edge of one scope (full wipe). */
  async deleteByScope(
    lane: MemoryLinkLane,
    collection: string,
    scopeKey: string,
  ): Promise<void> {
    await this.prisma.memoryLink.deleteMany({
      where: { lane, collection, scopeKey },
    });
  }

  /** Drop every edge of one kind in a scope (topical recompute purge). */
  async deleteByKind(
    lane: MemoryLinkLane,
    collection: string,
    scopeKey: string,
    kind: MemoryLinkKind,
  ): Promise<void> {
    await this.prisma.memoryLink.deleteMany({
      where: { lane, collection, scopeKey, kind },
    });
  }
}
