import type { ConstellationEdge } from '../MemoryConstellation.types';

/** Build one simulation link from a constellation edge. */
export function mapEdgeToSimLink(edge: ConstellationEdge) {
  return {
    source: edge.source,
    target: edge.target,
    kind: edge.kind,
    score: edge.score,
  };
}
