import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

import type { TaxonomyLane } from '../composables/use-taxonomy-manager.types';

export interface TaxonomyLeavesPanelProps {
  /** The (node or tag) item whose leaves the panel lists. */
  item: MemoryTaxonomyNodeRecord;
  /** The active taxonomy lane (partition or encyclopedia). */
  lane: TaxonomyLane;
  /** The lane's scope key (partition key, or 'global'). */
  scopeKey: string;
}
