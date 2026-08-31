/** Normalize an extracted article into the lexicon search-result shape. */
export function mapArticleToSearchResult(article: {
  url?: unknown;
  title?: unknown;
  snippet?: unknown;
}) {
  return {
    url: typeof article.url === 'string' ? article.url : '',
    title: typeof article.title === 'string' ? article.title : undefined,
    snippet: typeof article.snippet === 'string' ? article.snippet : '',
  };
}
