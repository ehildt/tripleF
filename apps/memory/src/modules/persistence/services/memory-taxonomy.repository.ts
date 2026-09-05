import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { Prisma, PrismaClient } from '../../../generated/prisma/client.js';
import type { PostgresConfig } from '../../postgres/configs/postgres-config.adapter.js';
import { POSTGRES_CONFIG } from '../../postgres/constants/postgres.constants.js';
import type {
  MemoryTaxonomyAliasSource,
  MemoryTaxonomyKind,
  MemoryTaxonomyLane,
} from '../constants/memory-taxonomy.constant.js';

/** One taxonomy node read back (the registry row). */
export interface MemoryTaxonomyNodeRecord {
  id: string;
  lane: MemoryTaxonomyLane;
  scopeKey: string;
  kind: MemoryTaxonomyKind;
  parentId: string;
  name: string;
  normalizedName: string;
  icon?: string;
  summary?: string;
  createdBy: string;
  lastReflectedAt?: Date;
  lastConsolidatedAt?: Date;
  lastRelinkedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Input for adopting or minting a taxonomy node. */
export interface MemoryTaxonomyNodeInput {
  lane: MemoryTaxonomyLane;
  scopeKey: string;
  kind: MemoryTaxonomyKind;
  /** '' for cluster roots and flat tags. */
  parentId: string;
  /** Canonical display label as adopted. */
  name: string;
  /** Normalized lookup form (the store boundaries' canonical form). */
  normalizedName: string;
  icon?: string;
  summary?: string;
  createdBy: 'model' | 'user';
}

/** Which maintenance stamp a job touches on the nodes it worked under. */
export type MemoryTaxonomyMaintenanceField =
  'lastReflectedAt' | 'lastConsolidatedAt' | 'lastRelinkedAt';

/**
 * Postgres registry for the canonical macro-taxonomy — one row per label
 * tier per (lane, scopeKey), plus the permanent alias ledger of snapped,
 * renamed, and merged variants.
 *
 * Concurrency contract: parallel vectorize workers can both resolve the same
 * new label (check-then-act), so creation is get-or-create with a P2002
 * re-read — the unique key is the structural invariant, never the caller.
 * The same holds for alias inserts. Merge/rename move aliases before any
 * delete in one transaction so a killed label always keeps resolving.
 *
 * The table is owned by the main server (its migrations create it); this app
 * consumes it with its own generated client — no migrations run here.
 */
@Injectable()
export class MemoryTaxonomyRepository implements OnModuleInit, OnModuleDestroy {
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

  /** Every node of one scope (registry read for snapping, probing, tree). */
  async listNodes(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
  ): Promise<MemoryTaxonomyNodeRecord[]> {
    const rows = await this.prisma.memoryTaxonomyNode.findMany({
      where: { lane, scopeKey },
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    });
    return rows.map(mapNode);
  }

  /** Every alias row of one scope (the audit ledger for the tree view). */
  async listAliases(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
  ): Promise<
    Array<{
      nodeId: string;
      alias: string;
      source: string;
      score?: number;
      createdAt: Date;
    }>
  > {
    return this.prisma.memoryTaxonomyAlias.findMany({
      where: { lane, scopeKey },
      orderBy: { createdAt: 'asc' },
      select: {
        nodeId: true,
        alias: true,
        source: true,
        score: true,
        createdAt: true,
      },
    });
  }

  /** One node by id (undefined when gone). */
  async findNode(id: string): Promise<MemoryTaxonomyNodeRecord | undefined> {
    const row = await this.prisma.memoryTaxonomyNode.findUnique({
      where: { id },
    });
    return row ? mapNode(row) : undefined;
  }

  /**
   * Adopt-or-mint: read by the unique key, create on a miss, re-read on a
   * racing create (P2002) — safe for parallel workers minting the same label.
   */
  async getOrCreateNode(
    input: MemoryTaxonomyNodeInput,
  ): Promise<MemoryTaxonomyNodeRecord> {
    const key = uniqueKey(input);
    const existing = await this.prisma.memoryTaxonomyNode.findUnique({
      where: key,
    });
    if (existing) return mapNode(existing);
    try {
      return mapNode(
        await this.prisma.memoryTaxonomyNode.create({ data: input }),
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const raced = await this.prisma.memoryTaxonomyNode.findUnique({
          where: key,
        });
        if (raced) return mapNode(raced);
      }
      throw error;
    }
  }

  /** Resolve one normalized variant to its node id (undefined when unknown). */
  async resolveAlias(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    kind: MemoryTaxonomyKind,
    alias: string,
  ): Promise<string | undefined> {
    const row = await this.prisma.memoryTaxonomyAlias.findUnique({
      where: {
        lane_scopeKey_kind_alias: { lane, scopeKey, kind, alias },
      },
      select: { nodeId: true },
    });
    return row?.nodeId;
  }

  /**
   * Record an alias permanently (idempotent on retry/race). A racing insert
   * of the same alias wins silently — both racers resolved to the same node
   * by construction of the caller's snap decision.
   */
  async insertAlias(input: {
    nodeId: string;
    lane: MemoryTaxonomyLane;
    scopeKey: string;
    kind: MemoryTaxonomyKind;
    alias: string;
    source: MemoryTaxonomyAliasSource;
    score?: number;
  }): Promise<void> {
    try {
      await this.prisma.memoryTaxonomyAlias.create({ data: input });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  /** User rename: adopt the new name; the old one becomes a 'user' alias. */
  async renameNode(
    id: string,
    name: string,
    normalizedName: string,
  ): Promise<MemoryTaxonomyNodeRecord | undefined> {
    const node = await this.prisma.memoryTaxonomyNode.findUnique({
      where: { id },
    });
    if (!node) return undefined;
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.memoryTaxonomyNode.update({
        where: { id },
        data: { name, normalizedName },
      });
      await tx.memoryTaxonomyAlias.createMany({
        data: [
          {
            nodeId: id,
            lane: node.lane,
            scopeKey: node.scopeKey,
            kind: node.kind,
            alias: node.normalizedName,
            source: 'user',
          },
        ],
        skipDuplicates: true,
      });
      return row;
    });
    return mapNode(updated);
  }

  /**
   * User merge: every alias of the source moves to the target, the source's
   * own canonical name becomes a target alias, the source row is deleted —
   * inside one transaction so no variant is ever orphaned. Children of the
   * source re-parent to the target; a child whose normalized name collides
   * with an existing target child is exact-collapsed into it (its aliases
   * move over, then the duplicate row is deleted).
   */
  async mergeNodes(
    sourceId: string,
    targetId: string,
    provenance: { source?: MemoryTaxonomyAliasSource; score?: number } = {},
  ): Promise<void> {
    const source = await this.prisma.memoryTaxonomyNode.findUnique({
      where: { id: sourceId },
    });
    if (!source) return;
    await this.prisma.$transaction(async (tx) => {
      await tx.memoryTaxonomyAlias.updateMany({
        where: { nodeId: sourceId },
        data: { nodeId: targetId },
      });
      await tx.memoryTaxonomyAlias.createMany({
        data: [
          {
            nodeId: targetId,
            lane: source.lane,
            scopeKey: source.scopeKey,
            kind: source.kind,
            alias: source.normalizedName,
            source: provenance.source ?? 'user',
            score: provenance.score,
          },
        ],
        skipDuplicates: true,
      });
      await this.mergeChildren(tx, sourceId, targetId);
      await tx.memoryTaxonomyNode.delete({ where: { id: sourceId } });
    });
  }

  /**
   * Re-parent the source's children to the target, exact-collapsing
   * name-colliding children into their target counterpart (aliases move,
   * duplicate row deletes) so the unique (…, parentId, normalizedName) key
   * is never violated mid-merge.
   */
  private async mergeChildren(
    tx: Prisma.TransactionClient,
    sourceId: string,
    targetId: string,
  ): Promise<void> {
    const sourceChildren = await tx.memoryTaxonomyNode.findMany({
      where: { parentId: sourceId },
    });
    if (sourceChildren.length === 0) return;
    const targetChildren = await tx.memoryTaxonomyNode.findMany({
      where: { parentId: targetId },
    });
    const byName = new Map(
      targetChildren.map((child) => [child.normalizedName, child.id]),
    );
    for (const child of sourceChildren) {
      const collisionId = byName.get(child.normalizedName);
      if (!collisionId) {
        await tx.memoryTaxonomyNode.update({
          where: { id: child.id },
          data: { parentId: targetId },
        });
        continue;
      }
      await tx.memoryTaxonomyAlias.updateMany({
        where: { nodeId: child.id },
        data: { nodeId: collisionId },
      });
      await tx.memoryTaxonomyAlias.createMany({
        data: [
          {
            nodeId: collisionId,
            lane: child.lane,
            scopeKey: child.scopeKey,
            kind: child.kind,
            alias: child.normalizedName,
            source: 'user',
          },
        ],
        skipDuplicates: true,
      });
      // Grand-children follow the collapse (same rule, one level down).
      await this.mergeChildren(tx, child.id, collisionId);
      await tx.memoryTaxonomyNode.delete({ where: { id: child.id } });
    }
  }

  /** User/icon override (also used by the create-time model suggestion). */
  async setIcon(id: string, icon: string | null): Promise<void> {
    await this.prisma.memoryTaxonomyNode.update({
      where: { id },
      data: { icon },
    });
  }

  /** Stamp the maintenance field on every listed node (one batched write). */
  async touchMaintenance(
    ids: string[],
    field: MemoryTaxonomyMaintenanceField,
    at: Date,
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.memoryTaxonomyNode.updateMany({
      where: { id: { in: ids } },
      data: { [field]: at },
    });
  }

  /**
   * Stamp one maintenance field on every node whose normalized name is in
   * the given label list (grouped by kind; registries are small and the
   * callers aggregate labels per sweep).
   */
  async touchMaintenanceForLabels(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    labels: Array<{ kind: MemoryTaxonomyKind; normalizedName: string }>,
    field: MemoryTaxonomyMaintenanceField,
    at: Date,
  ): Promise<void> {
    const byKind = new Map<MemoryTaxonomyKind, Set<string>>();
    for (const entry of labels) {
      const bucket = byKind.get(entry.kind) ?? new Set();
      bucket.add(entry.normalizedName);
      byKind.set(entry.kind, bucket);
    }
    for (const [kind, names] of byKind) {
      await this.prisma.memoryTaxonomyNode.updateMany({
        where: {
          lane,
          scopeKey,
          kind,
          normalizedName: { in: [...names] },
        },
        data: { [field]: at },
      });
    }
  }
}

/** Map a Prisma row to the repository record (nulls → undefined). */
function mapNode(
  row: Prisma.MemoryTaxonomyNodeGetPayload<object>,
): MemoryTaxonomyNodeRecord {
  return {
    ...row,
    kind: row.kind as MemoryTaxonomyKind,
    lane: row.lane as MemoryTaxonomyLane,
    icon: row.icon ?? undefined,
    summary: row.summary ?? undefined,
    lastReflectedAt: row.lastReflectedAt ?? undefined,
    lastConsolidatedAt: row.lastConsolidatedAt ?? undefined,
    lastRelinkedAt: row.lastRelinkedAt ?? undefined,
  };
}

/** The compound unique lookup of one node input. */
function uniqueKey(input: MemoryTaxonomyNodeInput) {
  return {
    lane_scopeKey_kind_parentId_normalizedName: {
      lane: input.lane,
      scopeKey: input.scopeKey,
      kind: input.kind,
      parentId: input.parentId,
      normalizedName: input.normalizedName,
    },
  } as const;
}
