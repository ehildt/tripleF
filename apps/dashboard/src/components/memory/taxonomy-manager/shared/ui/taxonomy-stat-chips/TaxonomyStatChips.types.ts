import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

/** Props of the taxonomy stat chips row. */
export interface TaxonomyStatChipsProps {
  /** The tier item whose leaf/linked/children counts the chips show. */
  item: MemoryTaxonomyNodeRecord;
}
