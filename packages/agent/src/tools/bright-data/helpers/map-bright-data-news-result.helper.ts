import { SOURCE } from '../bright-data.constants.js';
import type { BrightDataNewsSearchResponse } from '../news-search.types.js';

type BrightDataNewsItem = NonNullable<BrightDataNewsSearchResponse['news']>[number];

/** Normalize a Bright Data news item into the news-search result shape. */
export function mapBrightDataNewsResult(r: BrightDataNewsItem) {
  return {
    title: r.title,
    snippet: r.description || '',
    url: r.link,
    source: r.source || SOURCE,
    date: r.date || '',
    imageUrl: r.image_url || '',
  };
}
