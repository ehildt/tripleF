import { SOURCE } from '../bright-data.constants.js';
import type { BrightDataWebSearchResponse } from '../web-search.types.js';

type BrightDataOrganicResult = NonNullable<BrightDataWebSearchResponse['organic']>[number];

/** Normalize a Bright Data organic result into the web-search result shape. */
export function mapBrightDataWebResult(r: BrightDataOrganicResult) {
  return {
    title: r.title,
    snippet: r.description || '',
    url: r.link,
    source: SOURCE,
  };
}
