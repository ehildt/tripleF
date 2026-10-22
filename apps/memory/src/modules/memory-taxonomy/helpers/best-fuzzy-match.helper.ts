import type { MemoryTaxonomyKind } from '../../persistence/constants/memory-taxonomy.constant.js';
import type { MemoryTaxonomyNodeRecord } from '../../persistence/services/memory-taxonomy.repository.types.js';
import { TAXONOMY_SNAP_THRESHOLDS } from '../constants/taxonomy-snap.constant.js';

import {
  sharesTokenOverlap,
  trigramSimilarity,
} from './trigram-similarity.helper.js';

/** The winning candidacy snap: the node plus its trigram score. */
interface TaxonomyFuzzyMatch {
  /** The registry node the label snapped onto. */
  node: MemoryTaxonomyNodeRecord;
  /** Trigram similarity that cleared the kind's threshold. */
  score: number;
}

/** The highest-scoring candidacy snap above the kind's threshold, if any. */
export function bestFuzzyMatch(
  label: string,
  pool: MemoryTaxonomyNodeRecord[],
  kind: MemoryTaxonomyKind,
): TaxonomyFuzzyMatch | undefined {
  let best: TaxonomyFuzzyMatch | undefined;
  for (const node of pool) {
    if (node.normalizedName === label) continue;
    if (!sharesTokenOverlap(label, node.normalizedName)) continue;
    const score = trigramSimilarity(label, node.normalizedName);
    if (
      score >= TAXONOMY_SNAP_THRESHOLDS[kind] &&
      (!best || score > best.score)
    ) {
      best = { node, score };
    }
  }
  return best;
}
