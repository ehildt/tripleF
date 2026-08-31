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
import { mapEdgeToSimLink } from './map-edge-to-sim-link.helper';
import { mapNodeToSimNode } from './map-node-to-sim-node.helper';

/** Static simulation ticks (no animation — run to a settled layout). */
const RELAX_TICKS = 200;
/** Reduced tick budget for large scenes (5000 dots still settle, faster). */
const RELAX_TICKS_LARGE = 60;
/** Node count above which the reduced tick budget applies. */
const LARGE_SCENE_NODE_COUNT = 2000;
/** Intra-topic (leaf → hub) target distance — leaves orbit their main dot. */
const INTRA_DISTANCE = 40;
/** Inter-topic (hub → hub) target distance — main dots stay further apart. */
const INTER_DISTANCE = 80;
/** Cluster (hub → cluster hub) distance — wider than inter so category
 *  hubs sit outside the ring of their member topics. */
const CLUSTER_DISTANCE = 140;

/** Target distance per edge kind — structural edges sit close, inter-topic
 *  edges apart, cluster hubs widest. */
const LINK_DISTANCE: Record<SimLink['kind'], number> = {
  intra: INTRA_DISTANCE,
  inter: INTER_DISTANCE,
  sibling: INTER_DISTANCE,
  cluster: CLUSTER_DISTANCE,
  root: CLUSTER_DISTANCE,
};
/** Repulsion strength (negative = repel). */
const CHARGE_STRENGTH = -30;
/** Collision radius (dot size) to prevent overlap. */
const COLLIDE_RADIUS = 8;

interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  kind: 'intra' | 'inter' | 'sibling' | 'cluster' | 'root';
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
  const simNodes: SimNode[] = nodes.map((node) => mapNodeToSimNode(node, seed));

  const simLinks: SimLink[] = edges
    .filter((edge) => seed.has(edge.source) && seed.has(edge.target))
    .map(mapEdgeToSimLink);

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
