/** Maximum length of a normalized taxonomy node label. */
const MAX_NODE_LENGTH = 120;

/**
 * The canonical form of a taxonomy NODE label (the singular aspect a fact or
 * chunk addresses under its hub): trimmed, lowercased, single-spaced.
 * Undefined inputs (and empty/oversized ones) normalize to undefined — the
 * write boundary treats them as "no node", which the strict chain refuses.
 */
export function normalizeNode(
  node: string | undefined | null,
): string | undefined {
  if (!node) return undefined;
  const clean = node.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!clean || clean.length > MAX_NODE_LENGTH) return undefined;
  return clean;
}
