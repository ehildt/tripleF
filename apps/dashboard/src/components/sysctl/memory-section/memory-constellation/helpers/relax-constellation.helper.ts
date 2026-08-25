import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force-3d';

import type {
  ConstellationEdge,
  ConstellationNode,
} from '../MemoryConstellation.types';
import type { ConstellationPosition } from '../MemoryConstellation.types';

/** Static simulation ticks (no animation — run to a settled layout). */
const RELAX_TICKS = 200;
/** Reduced tick budget for large scenes (5000 dots still settle, faster). */
const RELAX_TICKS_LARGE = 60;
/** Node count above which the reduced tick budget applies. */
const LARGE_SCENE_NODE_COUNT = 2000;
/** Intra-cluster (leaf → hub) target distance — leaves orbit their main dot. */
const INTRA_DISTANCE = 40;
/** Inter-cluster (hub → hub) target distance — main dots stay further apart. */
const INTER_DISTANCE = 80;
/** Community (hub → community hub) distance — wider than inter so category
 *  hubs sit outside the ring of their member clusters. */
const COMMUNITY_DISTANCE = 140;

/** Target distance per edge kind — structural edges sit close, inter-cluster
 *  edges apart, community hubs widest. */
const LINK_DISTANCE: Record<SimLink['kind'], number> = {
  intra: INTRA_DISTANCE,
  inter: INTER_DISTANCE,
  sibling: INTER_DISTANCE,
  community: COMMUNITY_DISTANCE,
  root: COMMUNITY_DISTANCE,
};
/** Repulsion strength (negative = repel). */
const CHARGE_STRENGTH = -30;
/** Collision radius (dot size) to prevent overlap. */
const COLLIDE_RADIUS = 8;

interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  kind: 'intra' | 'inter' | 'sibling' | 'community' | 'root';
  score?: number;
}

/**
 * Relax the deterministic seed layout with a short force pass: linked nodes
 * pull together (distance ∝ 1 − score), all nodes repel mildly, and collision
 * prevents overlap. Anchored nodes (the profile hub) and category dots stay
 * pinned at their seed positions. Deterministic: seeded positions + d3's
 * fixed-seed LCG.
 */
export function relaxConstellation(
  nodes: readonly ConstellationNode[],
  edges: readonly ConstellationEdge[],
  seed: ReadonlyMap<string, ConstellationPosition>,
): Map<string, ConstellationPosition> {
  const simNodes: SimNode[] = nodes.map((node) => {
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
  });

  const simLinks: SimLink[] = edges
    .filter((edge) => seed.has(edge.source) && seed.has(edge.target))
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      kind: edge.kind,
      score: edge.score,
    }));

  const simulation = forceSimulation<SimNode, SimLink>(simNodes, 3)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((node) => node.id)
        .distance((link) => LINK_DISTANCE[link.kind])
        .strength((link) => (link.kind === 'intra' ? 0.5 : 0.3)),
    )
    .force('charge', forceManyBody<SimNode>().strength(CHARGE_STRENGTH))
    .force('collide', forceCollide<SimNode>(COLLIDE_RADIUS))
    .stop();

  for (let i = 0; i < relaxTicksFor(nodes.length); i++) simulation.tick();

  const positions = new Map<string, ConstellationPosition>();
  for (const node of simNodes) {
    positions.set(node.id, {
      x: node.x ?? 0,
      y: node.y ?? 0,
      z: node.z ?? 0,
    });
  }
  return positions;
}

/** Tick budget by node count — large scenes settle with fewer passes. */
function relaxTicksFor(nodeCount: number): number {
  return nodeCount > LARGE_SCENE_NODE_COUNT ? RELAX_TICKS_LARGE : RELAX_TICKS;
}
