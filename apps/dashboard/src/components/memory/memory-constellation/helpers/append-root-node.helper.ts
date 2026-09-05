import type { VisibleAccumulator } from '../MemoryConstellation.types';
import { buildRootNode } from './build-root-node.helper';

/** Append the ZERO root dot at the scene origin (always visible). */
export function appendRootNode(
  acc: VisibleAccumulator,
  meta?: Array<{ label: string; value: string }>,
): void {
  const node = buildRootNode(meta);
  acc.nodeIndex.set(node.id, acc.visibleNodes.length);
  acc.visibleNodes.push(node);
  acc.positions.set(node.id, { x: 0, y: 0, z: 0 });
}
