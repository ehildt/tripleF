/** Canonical taxonomy labels stored on one leaf, independent of lane naming. */
export interface TaxonomyChainRecord {
  category?: string;
  community?: string;
  hub?: string;
  node?: string;
  tags: string[];
}

/** Encyclopedia chain plus the source-leaf identity used by count aggregation. */
export interface EncyclopediaTaxonomyChainRecord extends TaxonomyChainRecord {
  id: string;
  url: string;
  isLinked: boolean;
}
