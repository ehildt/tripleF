import type {
  ConstellationNode,
  PreparedLink,
} from '../MemoryConstellation.types';

/** Per-node edge degree (drives dot size + glow intensity). */
export function buildLinkCounts(
  linkIndices: readonly PreparedLink[],
  visibleNodes: readonly ConstellationNode[],
): Map<string, number> {
  const linkCounts = new Map<string, number>();
  for (const link of linkIndices) {
    // Friction edges are warning overlays, not graph connections — they must
    // not inflate a node's degree (dot size / glow).
    if (link.kind === 'friction') continue;
    const sourceId = visibleNodes[link.a].id;
    const targetId = visibleNodes[link.b].id;
    linkCounts.set(sourceId, (linkCounts.get(sourceId) ?? 0) + 1);
    linkCounts.set(targetId, (linkCounts.get(targetId) ?? 0) + 1);
  }
  return linkCounts;
}
