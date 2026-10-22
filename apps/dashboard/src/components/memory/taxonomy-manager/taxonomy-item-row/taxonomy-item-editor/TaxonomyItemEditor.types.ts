import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

export interface TaxonomyItemEditorProps {
  /** The taxonomy item being edited (rename placeholder, current icon). */
  item: MemoryTaxonomyNodeRecord;
  /** Same-tier siblings eligible as merge targets. */
  mergeCandidates: readonly MemoryTaxonomyNodeRecord[];
  /** Item → display label (parent disambiguation for the merge options). */
  candidateLabel: (item: MemoryTaxonomyNodeRecord) => string;
  /** Curated allowlist icon names for the picker grid. */
  iconNames: readonly string[];
  /** Commit the rename (the manager ignores empty/unchanged names). */
  onRename: (name: string) => void;
  /** Merge this item into the resolved target id. */
  onMerge: (targetId: string) => void;
  /** Set (name) or clear (null) the curated icon. */
  onSetIcon: (icon: string | null) => void;
}
