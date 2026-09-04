import type { MemoryClusterRecord } from '@/api/memory.api';

/** One cluster synopsis placed on the tree canvas (world coordinates). */
export interface SynopsisTreeNode {
  id: string;
  title: string;
  summary: string;
  level: number;
  memberCount: number;
  /** World coordinates (the view transform maps them to screen). */
  x: number;
  y: number;
}

/** One parent link: child node → its level-above parent cluster. */
export interface SynopsisTreeLink {
  fromId: string;
  toId: string;
}

/** Horizontal spacing between members of one level. */
const COLUMN_GAP = 200;
/** Vertical spacing between hierarchy levels. */
const LEVEL_GAP = 150;

/**
 * Deterministic banded layout for the synopsis hierarchy: each level is one
 * horizontal band — leaf clusters at the bottom, one level up per row, the
 * root at the top; `parentId` edges point upward. Leaf nodes sort by title
 * into centered, evenly spaced slots; every higher node centers on the mean
 * x of its laid-out children (title as the tie-breaker). Identical input
 * yields identical coordinates, so re-renders never jitter.
 */
export function buildSynopsisLayout(clusters: MemoryClusterRecord[]): {
  nodes: SynopsisTreeNode[];
  links: SynopsisTreeLink[];
} {
  const byLevel = new Map<number, MemoryClusterRecord[]>();
  for (const cluster of clusters) {
    const level = cluster.level ?? 0;
    byLevel.set(level, [...(byLevel.get(level) ?? []), cluster]);
  }
  const childIdsByParent = new Map<string, Set<string>>();
  for (const cluster of clusters) {
    if (!cluster.parentId) continue;
    const children = childIdsByParent.get(cluster.parentId) ?? new Set();
    children.add(cluster.id);
    childIdsByParent.set(cluster.parentId, children);
  }

  const nodes: SynopsisTreeNode[] = [];
  const xById = new Map<string, number>();
  const levels = [...byLevel.keys()].sort((a, b) => a - b);
  for (const level of levels) {
    const rows = [...(byLevel.get(level) ?? [])].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
    const y = -level * LEVEL_GAP;
    const offset = -((rows.length - 1) * COLUMN_GAP) / 2;
    let fallbackIndex = 0;
    for (const cluster of rows) {
      const childXs = [...(childIdsByParent.get(cluster.id) ?? [])]
        .map((id) => xById.get(id))
        .filter((x): x is number => x !== undefined);
      const x =
        childXs.length > 0
          ? childXs.reduce((sum, value) => sum + value, 0) / childXs.length
          : offset + fallbackIndex++ * COLUMN_GAP;
      xById.set(cluster.id, x);
      nodes.push({
        id: cluster.id,
        title: cluster.title,
        summary: cluster.summary,
        level,
        memberCount: cluster.memberCount,
        x,
        y,
      });
    }
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const links: SynopsisTreeLink[] = clusters.flatMap((cluster) =>
    cluster.parentId && nodeIds.has(cluster.id) && nodeIds.has(cluster.parentId)
      ? [{ fromId: cluster.id, toId: cluster.parentId }]
      : [],
  );
  return { nodes, links };
}
