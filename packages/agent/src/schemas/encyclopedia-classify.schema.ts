import { z } from 'zod';

/**
 * Structured template for the encyclopedia classification step — the JSON contract
 * the model fills when labeling one stored source document with its broad
 * category and the topic it is about. Source-agnostic: the same two labels
 * apply to fetched web pages, uploaded files, and search-result snippets
 * alike — classification reads the CONTENT, never the source shape.
 */
export const EncyclopediaClassifySchema = z.object({
  /**
   * One broad lowercase PLURAL family label for the document (e.g. `games`,
   * `work`, `health`) — the constellation's cluster tier. Never a specific
   * entity, product, company, or title.
   */
  category: z.string(),
  /**
   * The narrow topic the document is about (e.g. `wuthering waves`,
   * `q3 budget`) — the constellation's cluster tier. A short, specific,
   * reusable label, not a sentence and not a URL.
   */
  topic: z.string(),
});

export type EncyclopediaClassification = z.infer<typeof EncyclopediaClassifySchema>;
