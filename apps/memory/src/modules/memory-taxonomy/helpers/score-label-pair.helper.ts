import { cosineSimilarity } from '../../memory-partition/helpers/detect-clusters.helper.js';
import {
  RECONCILE_AGREEMENT_BONUS,
  RECONCILE_AGREEMENT_FLOOR,
} from '../constants/taxonomy-reconcile.constant.js';

import {
  sharesTokenOverlap,
  trigramSimilarity,
} from './trigram-similarity.helper.js';

/** The fused similarity of one candidate label pair (undefined below floor). */
export function scoreLabelPair(params: {
  nameA: string;
  nameB: string;
  vectorA?: number[];
  vectorB?: number[];
  floor: number;
}):
  | { score: number; signal: 'fuzzy' | 'semantic'; tokenOverlap: boolean }
  | undefined {
  const fuzzy = trigramSimilarity(params.nameA, params.nameB);
  const cosine =
    params.vectorA && params.vectorB
      ? cosineSimilarity(params.vectorA, params.vectorB)
      : 0;
  const agreement =
    fuzzy >= RECONCILE_AGREEMENT_FLOOR && cosine >= RECONCILE_AGREEMENT_FLOOR
      ? RECONCILE_AGREEMENT_BONUS
      : 0;
  const score = Math.min(1, Math.max(fuzzy, cosine) + agreement);
  if (score < params.floor) return undefined;
  return {
    score,
    signal: fuzzy >= cosine ? 'fuzzy' : 'semantic',
    tokenOverlap: sharesTokenOverlap(params.nameA, params.nameB),
  };
}
