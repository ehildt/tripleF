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
 * (clusters → communities → hubs → tags) so parent refs resolve first.
 * Per-fact labels inherit the turn-side labels as their parent context;
 * explicit fact labels get their own entries. Deduped by
 * (kind, parentRef, label).
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
    const categoryRef = fact.category ?? extraction.category;
    const communityRef = fact.community ?? extraction.community;
    if (fact.category) push({ kind: 'cluster', label: fact.category });
    if (fact.community) {
      push({
        kind: 'community',
        label: fact.community,
        parentRef: categoryRef,
      });
    }
    if (fact.subject) {
      push({
        kind: 'hub',
        label: fact.subject,
        parentRef: communityRef ?? categoryRef,
      });
    }
  }

  for (const tag of extraction.tags) {
    push({ kind: 'tag', label: tag });
  }
  return inputs;
}
