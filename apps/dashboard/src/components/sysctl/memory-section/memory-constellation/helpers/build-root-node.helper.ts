import type { ConstellationNode } from '../MemoryConstellation.types';
import { ROOT_NODE_ID } from './root-node-id.constant';

/**
 * The ZERO root dot: a neutral anchor at the scene origin (0,0,0) that every
 * category hub connects to. Not a real point — a synthetic, always-visible
 * marker of the diagram's center.
 */
export function buildRootNode(): ConstellationNode {
  return {
    id: ROOT_NODE_ID,
    label: '0',
    clusterKey: ROOT_NODE_ID,
    text: 'ZERO (0,0,0)',
    keys: [],
    isRoot: true,
  };
}
