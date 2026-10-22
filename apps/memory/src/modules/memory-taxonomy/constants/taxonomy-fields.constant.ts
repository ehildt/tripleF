import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';

/**
 * The tier → Qdrant payload-field mapping per lane: partition hubs are the
 * `subject` payload and nodes the `node` payload, encyclopedia hubs the
 * `topic`; the encyclopedia carries no tag bag. Shared by every
 * label-rewrite/count path (reconcile sweep, user rename/merge propagation,
 * leaf listing).
 */
export const TAXONOMY_LANE_FIELDS: Record<
  'partition' | 'encyclopedia',
  Partial<Record<MemoryTaxonomyKind, string>>
> = {
  partition: {
    cluster: 'category',
    community: 'community',
    hub: 'subject',
    node: 'node',
    tag: 'tags',
  },
  encyclopedia: {
    cluster: 'category',
    community: 'community',
    hub: 'topic',
    node: 'node',
  },
};
