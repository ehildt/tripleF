import { normalizeCategory } from '../../../../helpers/normalize-category.helper.js';

/** Project a category facet into the normalized value/count shape. */
export function mapFacetToCategory(facet: { value: string; count: number }) {
  return {
    value: normalizeCategory(facet.value),
    count: facet.count,
  };
}
