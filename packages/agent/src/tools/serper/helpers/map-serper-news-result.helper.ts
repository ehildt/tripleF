import type { SerperNewsSearchResponse } from '../news-search.types.js';

type SerperNewsItem = NonNullable<SerperNewsSearchResponse['news']>[number];

/** Normalize a Serper news item into the news-search result shape. */
export function mapSerperNewsResult(r: SerperNewsItem) {
  return {
    title: r.title,
    snippet: r.snippet || '',
    url: r.link,
    source: r.source || '',
    date: r.date || '',
    imageUrl: r.imageUrl || '',
  };
}
