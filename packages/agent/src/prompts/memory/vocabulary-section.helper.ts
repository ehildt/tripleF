/**
 * Reuse-first hint: the memory partition's existing category/tag vocabulary.
 * Appended to extraction and write prompts so the model extends the taxonomy
 * instead of minting near-duplicate labels.
 */
export function buildVocabularySection(
  knownCategories: readonly string[] = [],
  knownTags: readonly string[] = [],
): string {
  if (knownCategories.length === 0 && knownTags.length === 0) return '';

  const lines: string[] = [];
  if (knownCategories.length > 0) {
    lines.push(
      `KNOWN CATEGORIES (reuse one when it fits; only mint a new plural family noun when none applies): ${knownCategories.join(', ')}`,
    );
  }
  if (knownTags.length > 0) {
    lines.push(`KNOWN TOPICS (reuse these tag labels when they fit): ${knownTags.join(', ')}`);
  }
  return lines.join('\n');
}
