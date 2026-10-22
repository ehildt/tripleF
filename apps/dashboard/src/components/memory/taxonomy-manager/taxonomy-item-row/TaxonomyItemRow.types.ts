import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

export interface TaxonomyItemRowProps {
  /** The taxonomy item rendered. */
  item: MemoryTaxonomyNodeRecord;
  /** Same-tier merge candidates (the item itself excluded). */
  mergeCandidates: readonly MemoryTaxonomyNodeRecord[];
  /** Item → disambiguated label (used for merge options only). */
  candidateLabel: (item: MemoryTaxonomyNodeRecord) => string;
  /** Item editing state — the inline editor is open. */
  editing: boolean;
  /** Curated allowlist icon names (icon picker). */
  iconNames: readonly string[];
}

export interface TaxonomyItemRowEmits {
  (e: 'toggleEdit'): void;
  (e: 'rename', name: string): void;
  (e: 'merge', intoId: string): void;
  (e: 'setIcon', icon: string | null): void;
}
