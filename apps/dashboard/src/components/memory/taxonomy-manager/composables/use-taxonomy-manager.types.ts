import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

/** Which lane's taxonomy the manager shows. */
export type TaxonomyLane = 'partition' | 'encyclopedia';

/** One tier bucket of the manager tree. */
export interface TaxonomyTier {
  kind: MemoryTaxonomyNodeRecord['kind'];
  nodes: MemoryTaxonomyNodeRecord[];
}
