import { TAXONOMY_ICON_ALLOWLIST } from '@triplef/agent/schemas';

/**
 * Canonical form of a model-suggested taxonomy icon: the allowlisted Lucide
 * name, or undefined (dropped, never stored) for anything outside the
 * curated set — the model is prompt-guided toward it, the boundary enforces.
 */
export function normalizeTaxonomyIcon(
  icon: string | undefined | null,
): string | undefined {
  if (!icon) return undefined;
  const clean = icon.trim().toLowerCase();
  return (TAXONOMY_ICON_ALLOWLIST as readonly string[]).includes(clean)
    ? clean
    : undefined;
}
