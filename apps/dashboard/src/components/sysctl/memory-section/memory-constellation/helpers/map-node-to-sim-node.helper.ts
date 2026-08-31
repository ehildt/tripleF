import type {
  ConstellationNode,
  ConstellationPosition,
} from '../MemoryConstellation.types';

/** Build one simulation node from a constellation node and its seed. */
export function mapNodeToSimNode(
  node: ConstellationNode,
  seed: ReadonlyMap<string, ConstellationPosition>,
) {
  const pos = seed.get(node.id) ?? { x: 0, y: 0, z: 0 };
  const pinned = node.anchorToOrigin === true || node.isCategory === true;
  return {
    id: node.id,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    fx: pinned ? pos.x : null,
    fy: pinned ? pos.y : null,
    fz: pinned ? pos.z : null,
  };
}
