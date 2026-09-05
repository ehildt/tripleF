import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';

/** One label of a touched taxonomy node entry. */
export interface TaxonomyLabelEntry {
  kind: MemoryTaxonomyKind;
  normalizedName: string;
}

/**
 * The taxonomy label entries of one point's labels — cluster/community/hub
 * keyed off the tier fields (`category`/`community`/`subject` for partition
 * facts, `topic` for encyclopedia hubs). Shared by the maintenance sweeps
 * for their per-node timestamp stamps. Empty labels are dropped.
 */
export function taxonomyLabelEntries(labels: {
  cluster?: string;
  community?: string;
  hub?: string;
}): TaxonomyLabelEntry[] {
  const entries: TaxonomyLabelEntry[] = [];
  if (labels.cluster) {
    entries.push({ kind: 'cluster', normalizedName: labels.cluster });
  }
  if (labels.community) {
    entries.push({ kind: 'community', normalizedName: labels.community });
  }
  if (labels.hub) {
    entries.push({ kind: 'hub', normalizedName: labels.hub });
  }
  return entries;
}
