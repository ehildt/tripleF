/** The scope's known taxonomy labels, grouped by tier. */
export interface TaxonomyVocabulary {
  /** Cluster tier — plural family nouns (e.g. `games`, `stocks`). */
  categories?: readonly string[];
  /** Community tier — plural sub-families (e.g. `survival-games`). */
  communities?: readonly string[];
  /** Hub tier — singular subject entities (e.g. `project zomboid`). */
  hubs?: readonly string[];
  /** Tag vocabulary — narrow recall filter labels. */
  tags?: readonly string[];
}

/**
 * Reuse-first hint: the memory space's existing taxonomy vocabulary, grouped
 * by tier (cluster → community → hub, plus the tag recall vocabulary).
 * Appended to extraction, write, and classify prompts so the model extends
 * the taxonomy instead of minting near-duplicate labels. Ranked subsets, not
 * dumps: the caller passes the labels most relevant to the source text.
 */
export function buildVocabularySection(vocab: TaxonomyVocabulary = {}): string {
  const { categories = [], communities = [], hubs = [], tags = [] } = vocab;
  if (categories.length === 0 && communities.length === 0 && hubs.length === 0 && tags.length === 0) {
    return '';
  }

  const lines: string[] = [];
  if (categories.length > 0) {
    lines.push(
      `KNOWN CATEGORIES (cluster tier — reuse one when it fits; only mint a new plural family noun when none applies): ${categories.join(', ')}`,
    );
  }
  if (communities.length > 0) {
    lines.push(
      `KNOWN COMMUNITIES (community tier — plural sub-families under a category; reuse when they fit): ${communities.join(', ')}`,
    );
  }
  if (hubs.length > 0) {
    lines.push(
      `KNOWN HUBS (hub tier — singular subject entities; name them verbatim when the text is about one): ${hubs.join(', ')}`,
    );
  }
  if (tags.length > 0) {
    lines.push(`KNOWN TOPICS (reuse these tag labels when they fit): ${tags.join(', ')}`);
  }
  return lines.join('\n');
}
