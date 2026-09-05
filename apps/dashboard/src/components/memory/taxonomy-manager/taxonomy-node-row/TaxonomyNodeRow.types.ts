import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

export interface TaxonomyNodeRowProps {
  /** The taxonomy node rendered. */
  node: MemoryTaxonomyNodeRecord;
  /** Same-tier merge candidates (the node itself excluded). */
  mergeCandidates: readonly MemoryTaxonomyNodeRecord[];
  /** Node id → display label (parent disambiguation for merge options). */
  candidateLabel: (node: MemoryTaxonomyNodeRecord) => string;
  /** Row editing state — the inline editor is open. */
  editing: boolean;
  /** Curated allowlist icon names (icon picker). */
  iconNames: readonly string[];
}

export interface TaxonomyNodeRowEmits {
  (e: 'toggleEdit'): void;
  (e: 'rename', name: string): void;
  (e: 'merge', intoId: string): void;
  (e: 'setIcon', icon: string | null): void;
}
