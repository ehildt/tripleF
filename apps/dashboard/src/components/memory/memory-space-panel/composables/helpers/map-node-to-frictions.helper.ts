import type {
  ConstellationFriction,
  ConstellationNode,
} from '../../../memory-constellation/MemoryConstellation.types';

/**
 * The open frictions a node is party to (source OR target — a friction is an
 * undirected contested pair). Drives the metadata column's warning section
 * for the selected dot: each entry is one active conflict with its
 * LLM-written reason.
 */
export function mapNodeToFrictions(
  node: ConstellationNode | null,
  frictions: readonly ConstellationFriction[],
): ConstellationFriction[] {
  if (!node || frictions.length === 0) return [];
  return frictions.filter(
    (friction) => friction.source === node.id || friction.target === node.id,
  );
}
