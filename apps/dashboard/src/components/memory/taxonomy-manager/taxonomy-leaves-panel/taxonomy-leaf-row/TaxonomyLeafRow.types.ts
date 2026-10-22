import type { MemoryTaxonomyLeafRecord } from '@/api/memory-taxonomy.api';

export interface TaxonomyLeafRowProps {
  /** The leaf (a folded chunk/fact) the row presents. */
  leaf: MemoryTaxonomyLeafRecord;
}
