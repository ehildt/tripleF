import type { MemoryTaxonomyNodeKind } from '@/api/memory-taxonomy.api';

/** The taxonomy tiers — the API record's `kind` contract. */
export type TaxonomyItemKind = MemoryTaxonomyNodeKind;

/** Props of the kind-tinted taxonomy icon chip. */
export interface TaxonomyKindChipProps {
  /** The tier — sets the chip's harmony-palette tint. */
  kind: TaxonomyItemKind;
  /** The curated icon name (allowlist-managed); absent shows the fallback. */
  iconName?: string;
  /** Chip sizing: rows use the small chip, the single item surface the large. */
  size?: 'sm' | 'md';
}
