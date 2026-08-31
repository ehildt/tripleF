import type { z } from 'zod';

import { eodhdNewsApiArticleSchema } from '../eodhd-api.types.js';

type EodhdNewsApiArticle = z.infer<typeof eodhdNewsApiArticleSchema>;

/** Normalize an EODHD news article into the camelCase domain shape. */
export function mapEodhdNewsArticle(a: EodhdNewsApiArticle) {
  return {
    title: a.title,
    link: a.link,
    date: a.date,
    content: a.content,
    symbols: a.symbols,
    tags: a.tags,
  };
}
