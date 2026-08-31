import type { ConstellationNode } from '../MemoryConstellation.types';
import { ROOT_NODE_ID } from './root-node-id.constant';

/**
 * The ZERO root dot: a neutral anchor at the scene origin (0,0,0) that every
 * category hub connects to. Not a real point — a synthetic, always-visible
 * marker of the diagram's center. Clicking it selects it (no expand — there
 * is nothing folded under it): the metadata column then shows the space's
 * health rollup (fact/source/topic/cluster/link/friction counts).
 */
export function buildRootNode(
  meta?: Array<{ label: string; value: string }>,
): ConstellationNode {
  return {
    id: ROOT_NODE_ID,
    label: '0',
    topicKey: ROOT_NODE_ID,
    text: meta?.length
      ? 'ZERO — space overview: the aggregate health of every dot in this space'
      : 'ZERO (0,0,0)',
    summary: meta?.length ? 'memory health' : undefined,
    keys: [],
    meta,
    isRoot: true,
  };
}
