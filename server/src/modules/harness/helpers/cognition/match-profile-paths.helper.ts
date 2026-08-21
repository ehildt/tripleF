/** Minimum value length eligible as a probe trigger — anything shorter false-matches too easily. */
const MIN_TRIGGER_LENGTH = 3;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Token-match profile path values against the user prompt — the deterministic
 * routing phase of the cognition probe (no model call needed: profile values
 * are deliberately short topic strings, so a phrase hit means the facet is
 * hot this turn). Word-boundary matching keeps "AI" from firing inside
 * "said"/"again"; case-insensitive, prompt language as-is.
 */
export function matchProfilePaths(
  prompt: string,
  entries: Array<{ path: string; value: string }>,
): Array<{ path: string; value: string }> {
  const text = prompt.trim().toLowerCase();
  if (!text) return [];
  return entries.filter(({ value }) => {
    const needle = value.toLowerCase();
    if (needle.length < MIN_TRIGGER_LENGTH) return false;
    return new RegExp(
      `(^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}([^\\p{L}\\p{N}]|$)`,
      'u',
    ).test(text);
  });
}
