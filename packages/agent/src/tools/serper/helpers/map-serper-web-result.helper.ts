import type { SerperWebSearchResponse } from '../web-search.types.js';

type SerperOrganicResult = NonNullable<SerperWebSearchResponse['organic']>[number];

/** Normalize a Serper organic result into the web-search result shape. */
export function mapSerperWebResult(r: SerperOrganicResult) {
  return {
    title: r.title,
    snippet: r.snippet || '',
    url: r.link,
    source: 'serper',
  };
}
