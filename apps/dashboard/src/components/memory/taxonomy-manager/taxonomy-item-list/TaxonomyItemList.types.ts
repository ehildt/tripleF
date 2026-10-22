import type {
  TaxonomyItemRowEmits,
  TaxonomyItemRowProps,
} from '../taxonomy-item-row/TaxonomyItemRow.types';

/**
 * The list passes the row contract straight through — it renders exactly the
 * drilled-in item's manage row, so props and events are the row's (docs on
 * each field live in the row's types file; keep the contracts in sync there).
 */
export type TaxonomyItemListProps = TaxonomyItemRowProps;
export type TaxonomyItemListEmits = TaxonomyItemRowEmits;
