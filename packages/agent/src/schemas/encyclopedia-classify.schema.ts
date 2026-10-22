import { z } from 'zod';

/**
 * Structured template for the encyclopedia classification step — the JSON contract
 * the model fills when labeling one stored source document with its full
 * strict taxonomy chain (category → community → topic → node). Source-agnostic: the
 * same labels apply to fetched web pages, uploaded files, and search-result
 * snippets alike — classification reads the CONTENT, never the source shape.
 */
export const EncyclopediaClassifySchema = z.object({
  /**
   * One broad lowercase PLURAL family label for the document (e.g. `games`,
   * `work`, `health`) — the constellation's CLUSTER tier. Never a specific
   * entity, product, company, or title. Fiction/entertainment content takes
   * the medium family (e.g. `shows`) — never an in-universe domain (`family`,
   * `education`, `business` describe reality, not an invented life).
   */
  category: z.string(),
  /**
   * One lowercase PLURAL sub-family narrowing the category (e.g.
   * `survival-games` under `games`, `tv-shows` under `shows`) — the
   * constellation's COMMUNITY tier, one level below the cluster. The chain
   * is strict, so community is always present. Never a specific entity,
   * product, company, or title — a show/work title like `breaking-bad` is a
   * hub, never a community.
   */
  community: z.string(),
  /**
   * The narrow SINGULAR subject entity the document is about (e.g.
   * `wuthering waves`, `q3 budget`) — the constellation's HUB tier. A short,
   * specific, reusable label, not a sentence and not a URL.
   */
  topic: z.string(),
  /**
   * The SINGULAR aspect of the document under its hub (e.g. `base building`
   * under `project zomboid`, `department spend` under `q3 budget`) — the
   * constellation's NODE tier, one level below the hub: a named sub-entity
   * or topic branch the chunks file under. Reuse the known vocabulary
   * instead of minting near-variants.
   */
  node: z.string(),
  icon: z.string().optional(),
});

export type EncyclopediaClassification = z.infer<typeof EncyclopediaClassifySchema>;
