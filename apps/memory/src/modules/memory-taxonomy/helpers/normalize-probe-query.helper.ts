import type { MemoryTaxonomyProbeInput } from '@triplef/agent/tools';

import { normalizeCategory } from '../../memory-partition/helpers/normalize-category.helper.js';
import { normalizeCommunity } from '../../qdrant/helpers/normalize-community.helper.js';
import { normalizeNode } from '../../qdrant/helpers/normalize-node.helper.js';
import { normalizeSubject } from '../../qdrant/helpers/normalize-subject.helper.js';

/** Normalize a probe query with its tier's boundary normalizer. */
export function normalizeProbeQuery(
  kind: MemoryTaxonomyProbeInput['kind'],
  query: string,
): string {
  const normalized =
    kind === 'cluster'
      ? normalizeCategory(query)
      : kind === 'community'
        ? normalizeCommunity(query)
        : kind === 'node'
          ? normalizeNode(query)
          : normalizeSubject(query);
  return normalized ?? query.trim().toLowerCase();
}
