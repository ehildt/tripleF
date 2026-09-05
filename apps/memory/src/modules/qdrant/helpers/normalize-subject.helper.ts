/** Subjects are capped like tags — an entity name, not a sentence. */
const MAX_SUBJECT_LENGTH = 40;

/**
 * Canonical form of an LLM-written fact subject: trimmed, lowercased, and
 * with whitespace runs folded to single spaces (an entity label like
 * `stellar blade`, never `Stellar Blade (2024 game)`). Mirrors
 * normalizeCategory's boundary role: normalized once in the extraction parse
 * so maintenance comparisons never fight case/format drift. Returns
 * undefined for empty/oversized input.
 */
export function normalizeSubject(
  subject: string | undefined | null,
): string | undefined {
  if (!subject) return undefined;
  const clean = subject.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!clean || clean.length > MAX_SUBJECT_LENGTH) return undefined;
  return clean;
}
