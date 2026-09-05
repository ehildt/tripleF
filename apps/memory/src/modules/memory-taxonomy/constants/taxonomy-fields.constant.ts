import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';

/**
 * The tier → Qdrant payload-field mapping per lane: partition hubs are the
 * `subject` payload, encyclopedia hubs the `topic`; the encyclopedia carries
 * no tag bag. Shared by every label-rewrite/count path (reconcile sweep,
 * user rename/merge propagation).
 */
export const TAXONOMY_LANE_FIELDS: Record<
  'partition' | 'encyclopedia',
  Partial<Record<MemoryTaxonomyKind, string>>
> = {
  partition: {
    cluster: 'category',
    community: 'community',
    hub: 'subject',
    tag: 'tags',
  },
  encyclopedia: {
    cluster: 'category',
    community: 'community',
    hub: 'topic',
  },
};
