import type {
  ConstellationFriction,
  ConstellationLink,
  ConstellationNode,
} from '../../memory-constellation/MemoryConstellation.types';

/** The three memory lanes — each has its own "curated" signal for strict mode. */
export type ConstellationLane = 'partition' | 'cognition' | 'encyclopedia';

/**
 * Apply the constellation's view mode to a space's nodes + links.
 *
 * - recommended (default): hide superseded points (stale truth adjudicated
 *   out by a friction resolution) — everything else stays visible, so freshly
 *   written, not-yet-reviewed points are never hidden.
 * - strict: keep only fully curated points. "Curated" is lane-specific:
 *   partition = consolidated (survived the dedupe adjudication), encyclopedia =
 *   classified (labeled by the classify pass), cognition = always (the
 *   profile + insights are the AI's own synthesized model — curated by
 *   construction). The shared gates are linked (has a constellation edge) and
 *   reflected — `isReflected` is treated as "not yet evaluated" when absent,
 *   so the reflection pass (deferred) does not gate until it actually runs.
 *
 * Links are pruned to edges whose both endpoints survive the filter, so the
 * constellation never renders dangling edges. Frictions are pruned the same
 * way — a warning edge only draws when both contested points are visible.
 */
export function applyConstellationView(
  nodes: readonly ConstellationNode[],
  links: readonly ConstellationLink[],
  strictMode: boolean,
  lane: ConstellationLane,
  frictions: readonly ConstellationFriction[] = [],
): {
  nodes: ConstellationNode[];
  links: ConstellationLink[];
  frictions: ConstellationFriction[];
} {
  const linkedIds = new Set(
    links.flatMap((link) => [link.source, link.target]),
  );
  const visible = nodes.filter((node) =>
    strictMode ? isStrictCurated(node, linkedIds, lane) : !node.superseded,
  );
  const visibleIds = new Set(visible.map((node) => node.id));
  return {
    nodes: visible,
    links: links.filter(
      (link) => visibleIds.has(link.source) && visibleIds.has(link.target),
    ),
    frictions: frictions.filter(
      (friction) =>
        visibleIds.has(friction.source) && visibleIds.has(friction.target),
    ),
  };
}

/** Strict mode: lane-curated + linked + reflected (reflection not yet run → no gate). */
function isStrictCurated(
  node: ConstellationNode,
  linkedIds: ReadonlySet<string>,
  lane: ConstellationLane,
): boolean {
  // Superseded (stale) and open-friction (contested) points are never
  // "fully curated" — excluded in strict mode regardless of lane.
  if (node.superseded || node.isFriction === true) return false;

  if (lane === 'cognition') {
    // Profile-field nodes are the AI's own structured model — curated by
    // construction. Conviction nodes are synthesized from reflected evidence
    // — curated by construction. Insight nodes are embedded points: gate
    // them like real points (linked + reflected-gate).
    if (node.id.startsWith('cognition-profile:')) return true;
    if (node.isConviction === true) return true;
    return linkedIds.has(node.id) && node.isReflected !== false;
  }

  // Bridges are synthesized from reflected evidence — curated by construction.
  if (node.isBridge) return true;

  const curated =
    lane === 'encyclopedia'
      ? // Classification is the encyclopedia's quality pass: a chunk is curated
        // once the classify job labeled it (clusterKey carries the category).
        Boolean(node.clusterKey)
      : // Consolidation is the partition's quality pass.
        node.isConsolidated === true;

  return curated && linkedIds.has(node.id) && node.isReflected !== false;
}
