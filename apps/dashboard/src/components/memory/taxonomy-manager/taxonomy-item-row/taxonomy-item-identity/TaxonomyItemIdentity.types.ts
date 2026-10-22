import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

export interface TaxonomyItemIdentityProps {
  /** The taxonomy item whose identity column renders. */
  item: MemoryTaxonomyNodeRecord;
}
