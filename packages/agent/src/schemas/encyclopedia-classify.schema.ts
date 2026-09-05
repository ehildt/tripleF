import { z } from 'zod';

/**
 * Structured template for the encyclopedia classification step — the JSON contract
 * the model fills when labeling one stored source document with its broad
 * category, optional community, and the topic it is about. Source-agnostic: the
 * same labels apply to fetched web pages, uploaded files, and search-result
 * snippets alike — classification reads the CONTENT, never the source shape.
 */
export const EncyclopediaClassifySchema = z.object({
  /**
   * One broad lowercase PLURAL family label for the document (e.g. `games`,
   * `work`, `health`) — the constellation's CLUSTER tier. Never a specific
   * entity, product, company, or title.
   */
  category: z.string(),
  /**
   * One lowercase PLURAL sub-family label narrowing the category (e.g.
   * `survival-games` under `games`) — the constellation's COMMUNITY tier, one
   * level below the cluster. Optional: omit when no sub-family applies. Never
   * a specific entity, product, company, or title.
   */
  community: z.string().optional(),
  /**
   * The narrow SINGULAR subject entity the document is about (e.g.
   * `wuthering waves`, `q3 budget`) — the constellation's HUB tier. A short,
   * specific, reusable label, not a sentence and not a URL.
   */
  topic: z.string(),
  /**
   * Lucide icon name for a label this classification CREATES (attached to
   * the deepest NEW label: topic first, then community, then category).
   * Only from the curated taxonomy icon set; omit when adopting existing
   * labels or no icon fits.
   */
  icon: z.string().optional(),
});

export type EncyclopediaClassification = z.infer<typeof EncyclopediaClassifySchema>;
