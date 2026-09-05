import type { MemoryExtraction } from '@triplef/agent/schemas';

import type { TaxonomyResolvedLabel } from '../services/taxonomy-resolution.service.js';

import {
  buildTaxonomyLabelInputs,
  taxonomyLabelKey,
} from './build-taxonomy-label-inputs.helper.js';

/**
 * Rewrite one extraction's labels to their resolved canonical names (the
 * snap/mint outcome of the taxonomy registry). Same-shaped in/out: the
 * extraction object keeps its structure; only category/community/subject/tag
 * wordings are replaced. `resolveLabels` preserves input order 1:1, so the
 * resolution zips against a rebuilt input list (same deterministic flatten —
 * the parentRef of each entry is the exact one resolution saw). A missing
 * lookup keeps the original label verbatim.
 */
export function applyTaxonomyResolution(
  extraction: MemoryExtraction,
  resolved: readonly TaxonomyResolvedLabel[],
): MemoryExtraction {
  const inputs = buildTaxonomyLabelInputs(extraction);
  const byKey = new Map<string, string>();
  inputs.forEach((input, index) => {
    const result = resolved[index];
    if (!result) return;
    byKey.set(
      taxonomyLabelKey(input.kind, input.parentRef, input.label),
      result.name,
    );
  });
  const lookup = (
    kind: string,
    parentRef: string | undefined,
    label: string,
  ): string => byKey.get(taxonomyLabelKey(kind, parentRef, label)) ?? label;

  const category = extraction.category
    ? lookup('cluster', undefined, extraction.category)
    : undefined;
  const community = extraction.community
    ? lookup('community', extraction.category, extraction.community)
    : undefined;

  return {
    facts: extraction.facts.map((fact) => {
      const categoryRef = fact.category ?? extraction.category;
      const communityRef = fact.community ?? extraction.community;
      return {
        ...fact,
        category: fact.category
          ? lookup('cluster', undefined, fact.category)
          : undefined,
        community: fact.community
          ? lookup('community', categoryRef, fact.community)
          : undefined,
        subject: fact.subject
          ? lookup('hub', communityRef ?? categoryRef, fact.subject)
          : undefined,
      };
    }),
    tags: extraction.tags.map((tag) => lookup('tag', undefined, tag)),
    category,
    community,
  };
}
