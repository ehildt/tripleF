/** Category labels are capped like tags — a family label, not a sentence. */
const MAX_CATEGORY_LENGTH = 40;

/**
 * Canonical form of a broad category label: trimmed, lowercased, and with
 * whitespace/underscore runs folded to a single hyphen. `PDF` and `pdf`
 * collapse to `pdf`; `dog` and `animal` never do — this is identity
 * normalization, not semantic merging. Applied at every write boundary
 * (upsertBatch) and by the relink job's collapse pass, so case drift cannot
 * re-enter the system. Returns undefined for empty/oversized input.
 */
export function normalizeCategory(
  category: string | undefined | null,
): string | undefined {
  if (!category) return undefined;
  const clean = category
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!clean || clean.length > MAX_CATEGORY_LENGTH) return undefined;
  return clean;
}
