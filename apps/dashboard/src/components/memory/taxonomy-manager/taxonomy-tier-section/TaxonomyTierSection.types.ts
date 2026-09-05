import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

import type { TaxonomyTier } from '../composables/use-taxonomy-manager.types';

export interface TaxonomyTierSectionProps {
  /** The tier bucket rendered by this section. */
  tier: TaxonomyTier;
  /** Section title (localized). */
  title: string;
  /** Section subtitle (localized). */
  description: string;
  /** Which node's editor is open (one at a time). */
  editingId: string | null;
  /** Node id → display label (parent disambiguation). */
  nodeLabel: (node: MemoryTaxonomyNodeRecord) => string;
  /** Curated allowlist icon names for the rows' pickers. */
  iconNames: readonly string[];
}

export interface TaxonomyTierSectionEmits {
  (e: 'toggleEdit', id: string): void;
  (e: 'rename', node: MemoryTaxonomyNodeRecord, name: string): void;
  (e: 'merge', node: MemoryTaxonomyNodeRecord, intoId: string): void;
  (e: 'setIcon', node: MemoryTaxonomyNodeRecord, icon: string | null): void;
}
