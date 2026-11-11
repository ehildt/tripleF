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
import { calcRelaxTicks } from './calc-relax-ticks.helper';
import { calcScoreLinkDistance } from './calc-score-link-distance.helper';
import { DEFAULT_INTER_LINK_MIN_SCORE } from './inter-link-min-score.constant';
import { mapEdgeToSimLink } from './map-edge-to-sim-link.helper';
import { mapNodeToSimNode } from './map-node-to-sim-node.helper';
import {
  CHARGE_STRENGTH,
  COLLIDE_RADIUS,
  STRUCTURAL_LINK_DISTANCE,
} from './relax-constellation.constant';

interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  kind: ConstellationEdge['kind'];
  score?: number;
}

/**
 * Relax the deterministic seed layout with a short force pass: structural
 * links use fixed distances, inter/sibling links use cutoff-normalized
 * non-linear cosine distances, all nodes repel mildly, and collision
 * prevents overlap. Anchored nodes (the profile hub) and category dots stay
 * pinned at their seed positions. Deterministic: seeded positions + d3's
 * fixed-seed LCG.
 */
export function relaxConstellation(
  nodes: readonly ConstellationNode[],
  edges: readonly ConstellationEdge[],
  seed: ReadonlyMap<string, ConstellationPosition>,
  interLinkMinScore: number = DEFAULT_INTER_LINK_MIN_SCORE,
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
        .distance((link) => {
          if (link.kind === 'inter' || link.kind === 'sibling') {
            return calcScoreLinkDistance(link.score, interLinkMinScore);
          }
          return STRUCTURAL_LINK_DISTANCE[link.kind];
        })
        .strength((link) => (link.kind === 'intra' ? 0.5 : 0.3)),
    )
    .force('charge', forceManyBody<SimNode>().strength(CHARGE_STRENGTH))
    .force('collide', forceCollide<SimNode>(COLLIDE_RADIUS))
    .stop();

  for (let i = 0; i < calcRelaxTicks(nodes.length); i++) simulation.tick();

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
