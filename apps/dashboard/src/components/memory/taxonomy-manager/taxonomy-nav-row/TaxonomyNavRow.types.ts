import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

export interface TaxonomyNavRowProps {
  /** The taxonomy item this row navigates to. */
  item: MemoryTaxonomyNodeRecord;
  /** Display label (resolved plain name in the drill context). */
  label: string;
}

export interface TaxonomyNavRowEmits {
  /** Fired when the row is activated — the manager rotates to this item. */
  (e: 'select'): void;
}
