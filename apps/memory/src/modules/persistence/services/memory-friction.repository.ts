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

import { mapFrictionRowToEdge } from './helpers/map-friction-row-to-edge.helper.js';

/** The three constellation lanes — one per memory layer (MemoryLane alias). */
export type MemoryFrictionLane = MemoryLane;

/** Friction kind — the reflection pass classifies the conflict. */
export type MemoryFrictionKind =
  'contradiction' | 'superseded' | 'outdated' | 'disagreement';

/** Friction lifecycle state. */
export type MemoryFrictionStatus = 'open' | 'resolved' | 'dismissed';

/** One friction read back for the dashboard. */
export interface MemoryFrictionEdge {
  source: string;
  target: string;
  kind: MemoryFrictionKind;
  status: MemoryFrictionStatus;
  reason?: string;
  resolution?: string;
}

/**
 * One open friction with its identity — the research job's contention input
 * (id + pair point ids + lane so the worker can load the pair's texts from
 * the right Qdrant collection).
 */
export interface MemoryFrictionRecord {
  id: string;
  lane: MemoryFrictionLane;
  scopeKey: string;
  source: string;
  target: string;
  kind: MemoryFrictionKind;
  reason?: string;
}

/** One friction row to write (canonical source < target ordering). */
interface MemoryFrictionRow {
  lane: MemoryFrictionLane;
  collection: string;
  scopeKey: string;
  source: string;
  target: string;
  kind: MemoryFrictionKind;
  status?: MemoryFrictionStatus;
  reason?: string;
  resolution?: string;
}

/**
 * Postgres storage for the memory-friction layer — one row per contradiction
 * or conflict between two Qdrant points, written by the reflection pass
 * (Phase 2). A friction is a state-machined pair: open until resolved or
 * dismissed; the losing point is marked superseded on resolution (never
 * deleted). Scoped like the link graph so the dashboard reads one space's
 * frictions with zero Qdrant round-trips.
 *
 * The table is owned by the main server (its migrations create it); this app
 * consumes it with its own generated client — no migrations run here.
 */
@Injectable()
export class MemoryFrictionRepository implements OnModuleInit, OnModuleDestroy {
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

  /** Insert frictions, skipping exact duplicates (idempotent on retry). */
  async upsertFrictions(rows: MemoryFrictionRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.prisma.memoryFriction.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }

  /** Frictions of one scope, newest first, capped at `limit`. */
  async listFrictions(
    lane: MemoryFrictionLane,
    collection: string,
    scopeKey: string,
    limit: number,
  ): Promise<MemoryFrictionEdge[]> {
    const rows = await this.prisma.memoryFriction.findMany({
      where: { lane, collection, scopeKey },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(mapFrictionRowToEdge);
  }

  /**
   * Open frictions across the given lanes, newest first, capped — the
   * research job's contested-memory input. The fetched evidence that could
   * settle them always lands in the global encyclopedia, so disputes are
   * collected across all scopes of a lane, not per scope.
   */
  async listOpen(
    lanes: MemoryFrictionLane[],
    limit: number,
  ): Promise<MemoryFrictionRecord[]> {
    if (lanes.length === 0 || limit <= 0) return [];
    const rows = await this.prisma.memoryFriction.findMany({
      where: { lane: { in: lanes }, status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      lane: row.lane as MemoryFrictionLane,
      scopeKey: row.scopeKey,
      source: row.source,
      target: row.target,
      kind: row.kind as MemoryFrictionKind,
      reason: row.reason ?? undefined,
    }));
  }

  /** Resolve one friction: record the outcome and close it. */
  async resolveFriction(id: string, resolution: string): Promise<void> {
    await this.prisma.memoryFriction.update({
      where: { id },
      data: { status: 'resolved', resolution, resolvedAt: new Date() },
    });
  }

  /** Resolve a friction by its unique pair key (the reflect job's path). */
  async resolveFrictionByPair(
    lane: MemoryFrictionLane,
    collection: string,
    scopeKey: string,
    source: string,
    target: string,
    resolution: string,
  ): Promise<void> {
    await this.prisma.memoryFriction.updateMany({
      where: { lane, collection, scopeKey, source, target },
      data: { status: 'resolved', resolution, resolvedAt: new Date() },
    });
  }

  /**
   * Count the OPEN frictions a point is still involved in — the reflect job
   * clears a point's `is_friction` payload flag only when this is zero (a
   * point can be party to several frictions; resolving one must not clear
   * the flag while another stays open).
   */
  async countOpenForPoint(pointId: string): Promise<number> {
    return this.prisma.memoryFriction.count({
      where: {
        status: 'open',
        OR: [{ source: pointId }, { target: pointId }],
      },
    });
  }

  /** Drop every friction touching any of the given point ids (delete cascade). */
  async deleteByPointIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.memoryFriction.deleteMany({
      where: { OR: [{ source: { in: ids } }, { target: { in: ids } }] },
    });
  }

  /** Drop every friction of one scope (full wipe). */
  async deleteByScope(
    lane: MemoryFrictionLane,
    collection: string,
    scopeKey: string,
  ): Promise<void> {
    await this.prisma.memoryFriction.deleteMany({
      where: { lane, collection, scopeKey },
    });
  }
}
