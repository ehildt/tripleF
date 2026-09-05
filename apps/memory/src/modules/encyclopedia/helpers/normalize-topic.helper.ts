/** Topic labels are short reusable phrases, not sentences. */
const MAX_TOPIC_LENGTH = 80;

/**
 * Canonical form of a encyclopedia topic label: trimmed, lowercased, and with
 * whitespace runs folded to a single space. `Wuthering Waves` and
 * `wuthering waves` collapse to `wuthering waves`; `dog` and `animal` never
 * do — this is identity normalization, not semantic merging. Returns
 * undefined for empty/oversized input.
 */
export function normalizeTopic(
  topic: string | undefined | null,
): string | undefined {
  if (!topic) return undefined;
  const clean = topic.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!clean || clean.length > MAX_TOPIC_LENGTH) return undefined;
  return clean;
}
