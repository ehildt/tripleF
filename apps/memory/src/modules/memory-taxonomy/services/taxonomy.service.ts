import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import type { MemoryTaxonomyLane } from '../../persistence/constants/memory-taxonomy.constant.js';
import { TAXONOMY_ROOT_PARENT } from '../../persistence/constants/memory-taxonomy.constant.js';
import type { MemoryTaxonomyNodeRecord } from '../../persistence/services/memory-taxonomy.repository.js';
import { MemoryTaxonomyRepository } from '../../persistence/services/memory-taxonomy.repository.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { EncyclopediaRepository } from '../../qdrant/services/encyclopedia.repository.js';
import { MemoryRepository } from '../../qdrant/services/memory.repository.js';
import { TaxonomyVectorRepository } from '../../qdrant/services/taxonomy-vector.repository.js';
import { TAXONOMY_LANE_FIELDS } from '../constants/taxonomy-fields.constant.js';
import { normalizeTaxonomyIcon } from '../helpers/normalize-taxonomy-icon.helper.js';
import { normalizeTaxonomyLabel } from '../helpers/normalize-taxonomy-label.helper.js';

import { TaxonomyMergeService } from './taxonomy-merge.service.js';

/** One taxonomy node with its operational metadata, for the dashboard. */
export interface TaxonomyNodeView {
  id: string;
  kind: MemoryTaxonomyNodeRecord['kind'];
  /** '' on roots (clusters) and flat tags. */
  parentId: string;
  name: string;
  icon?: string;
  summary?: string;
  createdBy: string;
  /** Leaves attached to this label (Qdrant point count). */
  leafCount: number;
  /** Leaves with at least one constellation link edge. */
  linkedCount: number;
  /** Direct children in the taxonomy tree. */
  childCount: number;
  aliases: Array<{
    alias: string;
    source: string;
    score?: number;
    createdAt: Date;
  }>;
  lastReflectedAt?: Date;
  lastConsolidatedAt?: Date;
  lastRelinkedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The taxonomy management surface: the dashboard's tree read and the user's
 * rename / merge / icon actions over the macro-taxonomy. The registry is the
 * AI's read-only pick-list; only these actions mutate labels after
 * persistence — every mutation propagates to the point payloads immediately
 * so the next probe/classify pass sees the updated taxonomy.
 */
@Injectable()
export class TaxonomyService {
  private readonly logger = new Logger(TaxonomyService.name);

  constructor(
    private readonly taxonomy: MemoryTaxonomyRepository,
    private readonly taxonomyMerge: TaxonomyMergeService,
    private readonly taxonomyVectors: TaxonomyVectorRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly memoryRepository: MemoryRepository,
    private readonly encyclopediaRepository: EncyclopediaRepository,
  ) {}

  /**
   * The scope's full taxonomy tree with per-node metadata: structural
   * topology (leaf/linked/child counts), maintenance stamps, the alias audit
   * trail. Flat list — the dashboard composes the tree from parentIds.
   */
  async listTree(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
  ): Promise<TaxonomyNodeView[]> {
    const [nodes, aliases] = await Promise.all([
      this.taxonomy.listNodes(lane, scopeKey),
      this.taxonomy.listAliases(lane, scopeKey),
    ]);
    const aliasesByNode = new Map<string, TaxonomyNodeView['aliases']>();
    for (const alias of aliases) {
      const bucket = aliasesByNode.get(alias.nodeId) ?? [];
      bucket.push({
        alias: alias.alias,
        source: alias.source,
        score: alias.score ?? undefined,
        createdAt: alias.createdAt,
      });
      aliasesByNode.set(alias.nodeId, bucket);
    }
    const childCountById = new Map<string, number>();
    for (const node of nodes) {
      if (node.parentId === TAXONOMY_ROOT_PARENT) continue;
      childCountById.set(
        node.parentId,
        (childCountById.get(node.parentId) ?? 0) + 1,
      );
    }
    return Promise.all(
      nodes.map(async (node) => ({
        id: node.id,
        kind: node.kind,
        parentId: node.parentId,
        name: node.name,
        icon: node.icon,
        summary: node.summary,
        createdBy: node.createdBy,
        leafCount: await this.countLeaves(lane, scopeKey, node, false),
        linkedCount: await this.countLeaves(lane, scopeKey, node, true),
        childCount: childCountById.get(node.id) ?? 0,
        aliases: aliasesByNode.get(node.id) ?? [],
        lastReflectedAt: node.lastReflectedAt,
        lastConsolidatedAt: node.lastConsolidatedAt,
        lastRelinkedAt: node.lastRelinkedAt,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      })),
    );
  }

  /**
   * User rename: adopt the new canonical name, propagate it onto every point
   * payload, refresh the label vector, and keep the old name forever as a
   * 'user' alias (inside renameNode). 409 when the target name already
   * exists under the same parent — that case is a merge, not a rename.
   */
  async renameNode(
    id: string,
    name: string,
  ): Promise<MemoryTaxonomyNodeRecord> {
    const node = await this.taxonomy.findNode(id);
    if (!node) throw new NotFoundException('Taxonomy node not found');
    const normalized = normalizeTaxonomyLabel(node.kind, name);
    if (!normalized) {
      throw new BadRequestException(
        `The name does not survive ${node.kind} normalization (empty or too long)`,
      );
    }
    if (normalized === node.normalizedName && node.name === normalized) {
      return node;
    }
    const nodes = await this.taxonomy.listNodes(node.lane, node.scopeKey);
    const collision = nodes.find(
      (other) =>
        other.id !== node.id &&
        other.kind === node.kind &&
        other.parentId === node.parentId &&
        other.normalizedName === normalized,
    );
    if (collision) {
      throw new ConflictException(
        `"${normalized}" already exists as a ${node.kind} under the same parent — merge the two labels instead`,
      );
    }

    const renamed = await this.taxonomy.renameNode(id, normalized, normalized);
    if (!renamed) throw new NotFoundException('Taxonomy node not found');
    await this.propagateRename(node, normalized);
    return renamed;
  }

  /**
   * User merge: `id` folds into `into`. The user names the winner — counts
   * do not decide here (unlike the reconciliation sweep). Propagates the
   * winner's label onto every leaf payload, then folds the node (aliases
   * move, children re-parent, name-colliding children exact-collapse).
   */
  async mergeNode(id: string, intoId: string): Promise<void> {
    if (id === intoId) {
      throw new BadRequestException('A node cannot merge into itself');
    }
    const [node, target] = await Promise.all([
      this.taxonomy.findNode(id),
      this.taxonomy.findNode(intoId),
    ]);
    if (!node || !target) {
      throw new NotFoundException('Taxonomy node not found');
    }
    if (
      node.lane !== target.lane ||
      node.scopeKey !== target.scopeKey ||
      node.kind !== target.kind
    ) {
      throw new BadRequestException(
        'Merges only work within one scope and tier',
      );
    }
    await this.taxonomyMerge.mergeLabels({
      lane: node.lane,
      scopeKey: node.scopeKey,
      winner: target,
      loser: node,
      source: 'user',
    });
  }

  /** User icon override — allowlisted names only; null clears the icon. */
  async setIcon(id: string, icon: string | null): Promise<void> {
    const node = await this.taxonomy.findNode(id);
    if (!node) throw new NotFoundException('Taxonomy node not found');
    const normalized = icon === null ? null : normalizeTaxonomyIcon(icon);
    if (icon !== null && !normalized) {
      throw new BadRequestException(
        'Unknown icon name — pick from the curated taxonomy icon set',
      );
    }
    await this.taxonomy.setIcon(id, normalized);
  }

  /** Leaf counts of one node's label (optionally only linked leaves). */
  private async countLeaves(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    node: MemoryTaxonomyNodeRecord,
    linkedOnly: boolean,
  ): Promise<number> {
    const field = TAXONOMY_LANE_FIELDS[lane][node.kind];
    if (!field) return 0;
    try {
      return lane === 'encyclopedia'
        ? await this.encyclopediaRepository.countByLabel(
            field as 'category' | 'community' | 'topic',
            node.name,
            { linkedOnly },
          )
        : await this.memoryRepository.countByLabel(
            scopeKey,
            field as 'category' | 'community' | 'subject' | 'tags',
            node.name,
            { linkedOnly },
          );
    } catch (error) {
      this.logger.warn(
        { lane, scopeKey, kind: node.kind, name: node.name },
        `taxonomy leaf count failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 0;
    }
  }

  /**
   * Rename side effects: payload rewrite onto every leaf, then the label
   * vector refresh (the embedded text changed) — best-effort, the registry
   * row already carries the truth.
   */
  private async propagateRename(
    node: MemoryTaxonomyNodeRecord,
    normalized: string,
  ): Promise<void> {
    await this.taxonomyMerge.renameLabel({
      lane: node.lane,
      scopeKey: node.scopeKey,
      kind: node.kind,
      from: node.name,
      to: normalized,
    });
    try {
      const [vector] = await this.embeddingService.embed(
        [normalized],
        'document',
      );
      if (vector) {
        await this.taxonomyVectors.upsertLabelPoints([
          {
            id: node.id,
            vector,
            lane: node.lane,
            scopeKey: node.scopeKey,
            kind: node.kind,
            parentId: node.parentId,
            normalizedName: normalized,
          },
        ]);
      }
    } catch (error) {
      this.logger.warn(
        { id: node.id, name: normalized },
        `taxonomy label re-embed after rename skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
