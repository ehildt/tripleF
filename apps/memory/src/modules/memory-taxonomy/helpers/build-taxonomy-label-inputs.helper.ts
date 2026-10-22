import type { MemoryExtraction } from '@triplef/agent/schemas';

import type { TaxonomyLabelInput } from '../services/taxonomy-resolution.service.js';

/** Dedup key for one label entry: tier + parent context + wording. */
export function taxonomyLabelKey(
  kind: string,
  parentRef: string | undefined,
  label: string,
): string {
  return `${kind}|${parentRef ?? ''}|${label}`;
}

/**
 * Flatten one extraction into its taxonomy-resolution entries, tier-ordered
 * (clusters → communities → hubs → nodes → tags) so parent refs resolve
 * first. The chain is strict: every fact carries category/community/subject/
 * node — no inheritance, no shortcuts. Turn-side labels still register as
 * context; deduped by (kind, parentRef, label).
 */
export function buildTaxonomyLabelInputs(
  extraction: MemoryExtraction,
): TaxonomyLabelInput[] {
  const seen = new Set<string>();
  const inputs: TaxonomyLabelInput[] = [];
  const push = (entry: TaxonomyLabelInput) => {
    const key = taxonomyLabelKey(entry.kind, entry.parentRef, entry.label);
    if (seen.has(key)) return;
    seen.add(key);
    inputs.push(entry);
  };

  if (extraction.category) {
    push({ kind: 'cluster', label: extraction.category });
  }
  if (extraction.community) {
    push({
      kind: 'community',
      label: extraction.community,
      parentRef: extraction.category,
    });
  }

  for (const fact of extraction.facts) {
    push({ kind: 'cluster', label: fact.category });
    push({
      kind: 'community',
      label: fact.community,
      parentRef: fact.category,
    });
    push({
      kind: 'hub',
      label: fact.subject,
      parentRef: fact.community,
    });
    push({
      kind: 'node',
      label: fact.node,
      parentRef: fact.subject,
    });
  }

  for (const tag of extraction.tags) {
    push({ kind: 'tag', label: tag });
  }
  return inputs;
}
