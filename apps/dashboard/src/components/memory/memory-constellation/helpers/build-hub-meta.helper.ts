import type {
  ConstellationFriction,
  ConstellationNode,
} from '../MemoryConstellation.types';

/**
 * A hub dot's leaf rollup: the aggregate stats of its members.
 *
 * The hub's payload is the rollup — the real data lives in the leafs, so the
 * hub answers "how much, how healthy, where from" at a glance (GraphRAG's
 * community-report lesson: main nodes carry size + rating + traceability;
 * Anthropic's MEMORY.md lesson: keep the index lean, sources stay pointers).
 *
 * Health rows appear only when the lane's pipeline actually writes the flag —
 * a tier that never reflects/consolidates points must not show a misleading
 * 0/N. `frictions`/`stale` surface only when non-zero (0 is the quiet norm).
 */
export interface HubRollup {
  /** Tooltip / metadata-column rows (label + value). */
  meta: Array<{ label: string; value: string }>;
  /** One-line capture, e.g. "17 records · 6 sources · 1 friction". */
  summary: string;
}

/** Aggregate a hub's member nodes into its rollup meta + one-line summary. */
export function buildHubMeta(
  members: readonly ConstellationNode[],
  frictions: readonly ConstellationFriction[] = [],
): HubRollup {
  const meta: Array<{ label: string; value: string }> = [
    { label: 'records', value: String(members.length) },
  ];

  const domainCounts = new Map<string, number>();
  const urls = new Set<string>();
  for (const member of members) {
    if (member.domain?.trim()) {
      domainCounts.set(
        member.domain,
        (domainCounts.get(member.domain) ?? 0) + 1,
      );
    }
    if (member.url?.trim()) urls.add(member.url);
  }
  if (domainCounts.size > 0) {
    meta.push({
      label: 'sources',
      value: `${domainCounts.size} domains · ${urls.size} urls`,
    });
    meta.push({
      label: 'top sources',
      value: [...domainCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([domain, count]) => `${domain} ×${count}`)
        .join(', '),
    });
  }

  const reflected = members.filter((member) => member.isReflected === true);
  if (members.some((member) => member.isReflected !== undefined)) {
    meta.push({
      label: 'reflected',
      value: `${reflected.length}/${members.length}`,
    });
  }
  const consolidated = members.filter(
    (member) => member.isConsolidated === true,
  );
  if (members.some((member) => member.isConsolidated !== undefined)) {
    meta.push({
      label: 'consolidated',
      value: `${consolidated.length}/${members.length}`,
    });
  }

  const stale = members.filter((member) => member.superseded === true).length;
  if (stale > 0) meta.push({ label: 'stale', value: String(stale) });

  const memberIds = new Set(members.map((member) => member.id));
  const openFrictions = frictions.filter(
    (friction) =>
      memberIds.has(friction.source) || memberIds.has(friction.target),
  ).length;
  if (openFrictions > 0) {
    meta.push({ label: 'frictions', value: String(openFrictions) });
  }

  const latest = members
    .map((member) => member.timestamp)
    .filter((timestamp): timestamp is string => Boolean(timestamp))
    .sort()
    .at(-1);
  if (latest) meta.push({ label: 'updated', value: latest.slice(0, 10) });

  const records = `${members.length} ${members.length === 1 ? 'record' : 'records'}`;
  const summary = [
    records,
    domainCounts.size > 0 ? `${domainCounts.size} sources` : undefined,
    openFrictions > 0 ? `${openFrictions} frictions` : undefined,
    stale > 0 ? `${stale} stale` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return { meta, summary };
}
