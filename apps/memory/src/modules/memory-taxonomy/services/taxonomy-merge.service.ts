import { Injectable } from '@nestjs/common';

import type {
  MemoryTaxonomyAliasSource,
  MemoryTaxonomyKind,
  MemoryTaxonomyLane,
} from '../../persistence/constants/memory-taxonomy.constant.js';
import type { MemoryTaxonomyNodeRecord } from '../../persistence/services/memory-taxonomy.repository.js';
import { MemoryTaxonomyRepository } from '../../persistence/services/memory-taxonomy.repository.js';
import { EncyclopediaRepository } from '../../qdrant/services/encyclopedia.repository.js';
import { MemoryRepository } from '../../qdrant/services/memory.repository.js';
import { TaxonomyVectorRepository } from '../../qdrant/services/taxonomy-vector.repository.js';
import { TAXONOMY_LANE_FIELDS } from '../constants/taxonomy-fields.constant.js';

/**
 * Merge application for two taxonomy nodes — shared by the reconciliation
 * sweep (provenance 'fuzzy' | 'semantic' | 'llm') and the user merge
 * endpoint (provenance 'user'). Order matters for resumability: the point
 * payload rewrite is idempotent, so a crash between steps simply re-runs;
 * the node fold is transactional inside the repository (aliases move, the
 * loser's name becomes a winner alias, children re-parent, name-colliding
 * children exact-collapse); the loser's label vector is dropped last.
 */
@Injectable()
export class TaxonomyMergeService {
  constructor(
    private readonly taxonomy: MemoryTaxonomyRepository,
    private readonly taxonomyVectors: TaxonomyVectorRepository,
    private readonly memoryRepository: MemoryRepository,
    private readonly encyclopediaRepository: EncyclopediaRepository,
  ) {}

  /**
   * Merge `loser` into `winner`: rewrite every point payload carrying the
   * losing label, record the provenance alias, fold the node, drop its
   * vector. Throws on store failures (the caller's job retries; the
   * endpoint surfaces an error).
   */
  async mergeLabels(params: {
    lane: MemoryTaxonomyLane;
    scopeKey: string;
    winner: MemoryTaxonomyNodeRecord;
    loser: MemoryTaxonomyNodeRecord;
    source: MemoryTaxonomyAliasSource;
    score?: number;
  }): Promise<void> {
    await this.rewritePoints(
      params.lane,
      params.scopeKey,
      params.winner.kind,
      params.loser.name,
      params.winner.name,
    );
    await this.taxonomy.mergeNodes(params.loser.id, params.winner.id, {
      source: params.source,
      score: params.score,
    });
    await this.taxonomyVectors.deleteLabelPoints([params.loser.id]);
  }

  /**
   * Rename propagation: rewrite every point payload carrying the old label
   * to the new canonical form (payload-only, idempotent). Pair with the
   * registry's `renameNode` (which records the old name as a `user` alias)
   * and a label-vector refresh at the call site.
   */
  async renameLabel(params: {
    lane: MemoryTaxonomyLane;
    scopeKey: string;
    kind: MemoryTaxonomyKind;
    from: string;
    to: string;
  }): Promise<void> {
    await this.rewritePoints(
      params.lane,
      params.scopeKey,
      params.kind,
      params.from,
      params.to,
    );
  }

  /** Rewrite every point payload carrying the losing label to the winner's. */
  private async rewritePoints(
    lane: MemoryTaxonomyLane,
    scopeKey: string,
    kind: MemoryTaxonomyKind,
    from: string,
    to: string,
  ): Promise<void> {
    const field = TAXONOMY_LANE_FIELDS[lane][kind];
    if (!field) return; // lane carries no such tier (encyclopedia tags)
    if (lane === 'encyclopedia') {
      await this.encyclopediaRepository.collapseLabel(
        field as 'category' | 'community' | 'topic',
        from,
        to,
      );
      return;
    }
    if (kind === 'tag') {
      await this.memoryRepository.retagLabel(scopeKey, from, to);
      return;
    }
    await this.collapsePartitionField(kind, scopeKey, from, to);
  }

  /** The partition lane's per-kind collapse call. */
  private async collapsePartitionField(
    kind: MemoryTaxonomyKind,
    memoryPartition: string,
    from: string,
    to: string,
  ): Promise<void> {
    if (kind === 'cluster') {
      await this.memoryRepository.collapseCategory(memoryPartition, from, to);
    } else if (kind === 'community') {
      await this.memoryRepository.collapseCommunity(memoryPartition, from, to);
    } else {
      await this.memoryRepository.collapseSubject(memoryPartition, from, to);
    }
  }
}
