import { describe, expect, it } from 'vitest';

import { extractArticles } from './extract-articles-from-tools.helper.js';

describe('extractArticles', () => {
  it('extracts article-like entries from web search results', () => {
    const articles = extractArticles([
      {
        toolName: 'serperWebSearch',
        result: {
          results: [
            {
              title: 'A real article',
              snippet: 'Body text.',
              link: 'https://example.com/story',
              source: 'Example News',
            },
          ],
        },
      },
    ]);
    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      title: 'A real article',
      url: 'https://example.com/story',
      sourceName: 'Example News',
    });
  });

  it('never treats video search results as articles', () => {
    const articles = extractArticles([
      {
        toolName: 'serperVideoSearch',
        result: {
          results: [
            {
              title: 'Dark Wave Mix 2026',
              snippet: 'A fresh German dark wave mix.',
              link: 'https://www.youtube.com/watch?v=cva63f_COnU',
              channel: 'SomeChannel',
            },
          ],
        },
      },
      {
        toolName: 'youtubeVideoSearch',
        result: {
          results: [
            {
              title: 'Another clip',
              link: 'https://www.youtube.com/watch?v=abc123',
            },
          ],
        },
      },
    ]);
    // Video URLs must not leak into the article pools — they are handled by
    // the dedicated media pipeline and would otherwise resurface media the
    // video path already filtered out.
    expect(articles).toHaveLength(0);
  });

  it('never treats image search results as articles', () => {
    const articles = extractArticles([
      {
        toolName: 'serperImageSearch',
        result: {
          results: [{ imageUrl: 'https://example.com/a.jpg' }],
        },
      },
      {
        toolName: 'brightDataImageSearch',
        result: {
          results: [{ imageUrl: 'https://example.com/b.jpg' }],
        },
      },
    ]);
    expect(articles).toHaveLength(0);
  });

  it('skips shopping, reviews and places results', () => {
    const articles = extractArticles([
      {
        toolName: 'serperShoppingSearch',
        result: { results: [{ title: 'Offer', link: 'https://shop.test/x' }] },
      },
      {
        toolName: 'serperReviewsSearch',
        result: { results: [{ title: 'Review', link: 'https://r.test/x' }] },
      },
      {
        toolName: 'serperPlacesSearch',
        result: { results: [{ title: 'Place', link: 'https://p.test/x' }] },
      },
    ]);
    expect(articles).toHaveLength(0);
  });
});
