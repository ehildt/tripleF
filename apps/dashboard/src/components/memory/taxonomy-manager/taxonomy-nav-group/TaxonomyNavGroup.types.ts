import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

/** Props of the taxonomy drill's tinted tier group. */
export interface TaxonomyNavGroupProps {
  /**
   * The group's tier — drives the head's icon, localized title/description,
   * and the harmony-palette stripe tint.
   */
  kind: 'cluster' | 'community' | 'hub' | 'node' | 'tag';
  /** The tier items listed as navigation rows, deepest drill step each. */
  items: MemoryTaxonomyNodeRecord[];
}
