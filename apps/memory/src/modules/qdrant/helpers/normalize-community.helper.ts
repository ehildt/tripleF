/** Community labels are short sub-family phrases, not sentences. */
const MAX_COMMUNITY_LENGTH = 60;

/**
 * Canonical form of a community label: trimmed, lowercased, and with
 * whitespace/underscore runs folded to a single hyphen — the plural
 * sub-family one tier below the category (`survival-games` under `games`).
 * Mirrors normalizeCategory's identity normalization (case/format fold only,
 * never semantic merging). Returns undefined for empty/oversized input.
 */
export function normalizeCommunity(
  community: string | undefined | null,
): string | undefined {
  if (!community) return undefined;
  const clean = community
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!clean || clean.length > MAX_COMMUNITY_LENGTH) return undefined;
  return clean;
}
