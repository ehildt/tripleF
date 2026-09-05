import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';

import type { ConstellationLabelMeta } from '../../memory-constellation/MemoryConstellation.types';

/** Stamp rows (ISO date prefix) for a node's maintenance timestamps. */
function stampRows(
  node: MemoryTaxonomyNodeRecord,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  if (node.lastReflectedAt) {
    rows.push({ label: 'reflected', value: node.lastReflectedAt.slice(0, 10) });
  }
  if (node.lastConsolidatedAt) {
    rows.push({
      label: 'consolidated',
      value: node.lastConsolidatedAt.slice(0, 10),
    });
  }
  if (node.lastRelinkedAt) {
    rows.push({ label: 'relinked', value: node.lastRelinkedAt.slice(0, 10) });
  }
  return rows;
}

/**
 * The taxonomy registry as a per-dot metadata map for the constellation:
 * synthetic macro-node id (`cluster:<label>`, `community:<label>`,
 * `topic:<label>`) → icon + summary + operational rows (leaf/linked/child
 * counts, maintenance stamps, alias trail size, provenance). Tags join
 * nothing — they stay recall vocabulary.
 *
 * When the cluster tier is keyed by server graph-cluster ids (the hash wins
 * over the category label), `facts` lets cluster labels ALSO attach to those
 * hubs: a graph cluster whose plurality member category equals a taxonomy
 * cluster's name registers under `cluster:<clusterId>` too.
 */
export function buildLabelMeta(
  nodes: readonly MemoryTaxonomyNodeRecord[],
  facts?: readonly { id: string; category?: string; clusterId?: string }[],
): ReadonlyMap<string, ConstellationLabelMeta> {
  const map = new Map<string, ConstellationLabelMeta>();
  for (const node of nodes) {
    const dotId = dotIdFor(node);
    if (!dotId) continue;
    map.set(dotId, {
      icon: node.icon,
      summary: node.summary,
      meta: [
        { label: 'tier', value: node.kind },
        { label: 'leaves', value: String(node.leafCount) },
        { label: 'linked', value: String(node.linkedCount) },
        { label: 'children', value: String(node.childCount) },
        { label: 'by', value: node.createdBy },
        ...(node.aliases.length > 0
          ? [
              {
                label: 'aliases',
                value: node.aliases.map((alias) => alias.alias).join(' · '),
              },
            ]
          : []),
        ...stampRows(node),
      ],
    });
  }
  attachGraphClusterAliases(map, nodes, facts);
  return map;
}

/**
 * Register each taxonomy cluster under the server graph-cluster ids whose
 * members' plurality category matches its name — so icons/meta land on the
 * `cluster:<clusterId>` hubs as well, not only on label-keyed hubs.
 */
function attachGraphClusterAliases(
  map: Map<string, ConstellationLabelMeta>,
  nodes: readonly MemoryTaxonomyNodeRecord[],
  facts?: readonly { id: string; category?: string; clusterId?: string }[],
): void {
  if (!facts?.length) return;
  // clusterId → plurality category among its member records.
  const counts = new Map<string, Map<string, number>>();
  for (const fact of facts) {
    const clusterId = fact.clusterId?.trim();
    const category = fact.category?.trim();
    if (!clusterId || !category) continue;
    const byCategory = counts.get(clusterId) ?? new Map<string, number>();
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    counts.set(clusterId, byCategory);
  }
  for (const node of nodes) {
    if (node.kind !== 'cluster') continue;
    const meta = map.get(`cluster:${node.name}`);
    if (!meta) continue;
    for (const [clusterId, byCategory] of counts) {
      if (pluralityCategory(byCategory) !== node.name) continue;
      map.set(`cluster:${clusterId}`, meta);
    }
  }
}

/** The category with the most members (ties: first-seen wins — deterministic input order). */
function pluralityCategory(
  byCategory: Map<string, number>,
): string | undefined {
  let best: string | undefined;
  let bestCount = 0;
  for (const [category, count] of byCategory) {
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }
  return best;
}

/** Synthetic dot id of one taxonomy node (tags stay unmapped — recall vocabulary). */
function dotIdFor(node: MemoryTaxonomyNodeRecord): string | undefined {
  if (node.kind === 'cluster') return `cluster:${node.name}`;
  if (node.kind === 'community') return `community:${node.name}`;
  if (node.kind === 'hub') return `topic:${node.name}`;
  return undefined;
}
