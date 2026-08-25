import type {
  ConstellationEdge,
  PreparedLink,
} from '../MemoryConstellation.types';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';

/** Fixed opacity for structural edges (leaf → hub, hub → community). */
const STRUCTURAL_ALPHA = 0.5;
/** Inter-cluster edge opacity at the minimum score (faintest drawn edge). */
const INTER_ALPHA_MIN = 0.15;
/** Inter-cluster edge opacity span (score 1 → INTER_ALPHA_MIN + span). */
const INTER_ALPHA_RANGE = 0.7;
/** Suggested (topical) inter edges render at this fraction of the score alpha. */
const SUGGESTED_ALPHA_FACTOR = 0.6;

/**
 * Resolve edges to visible-node indices and precompute each edge's opacity.
 * Structural edges (intra/community/root) are fixed; inter and sibling edges
 * lerp across the [minScore, 1] cosine domain into [INTER_ALPHA_MIN,
 * INTER_ALPHA_MIN + INTER_ALPHA_RANGE] — a weak-but-drawn edge is faint, a
 * near-duplicate is strong, and nothing below the bar exists at all
 * (filtered upstream). Suggested (topical) edges render at a fraction of
 * that alpha so suggestions read as fainter than enforced links.
 */
export function buildLinkIndices(
  edges: readonly ConstellationEdge[],
  nodeIndex: Map<string, number>,
  minScore: number = DEFAULT_INTER_LINK_MIN_SCORE,
): PreparedLink[] {
  const linkIndices: PreparedLink[] = [];
  for (const edge of edges) {
    const a = nodeIndex.get(edge.source);
    const b = nodeIndex.get(edge.target);
    if (a === undefined || b === undefined) continue;
    const isScored = edge.kind === 'inter' || edge.kind === 'sibling';
    const scoreAlpha = isScored
      ? INTER_ALPHA_MIN +
        INTER_ALPHA_RANGE *
          Math.max(
            0,
            Math.min(1, ((edge.score ?? 0) - minScore) / (1 - minScore)),
          )
      : STRUCTURAL_ALPHA;
    const alpha =
      isScored && edge.suggested
        ? scoreAlpha * SUGGESTED_ALPHA_FACTOR
        : scoreAlpha;
    linkIndices.push({
      a,
      b,
      kind: edge.kind,
      score: edge.score,
      alpha,
      suggested: edge.suggested ? true : undefined,
    });
  }
  return linkIndices;
}
