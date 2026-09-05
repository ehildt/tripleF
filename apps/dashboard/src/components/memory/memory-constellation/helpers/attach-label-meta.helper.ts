import type {
  ConstellationLabelMeta,
  PreparedConstellation,
} from '../MemoryConstellation.types';

/**
 * Attach taxonomy metadata onto the prepared macro-node dots: the registry's
 * icon, summary, and extra meta rows are merged onto cluster/community/topic
 * hub nodes keyed by their synthetic node id (`cluster:<key>`,
 * `community:<key>`, `topic:<key>`). Pure post-pass — layout, edges, colors
 * and fog are untouched; nodes without a registry row render unchanged.
 */
export function attachLabelMeta(
  prepared: PreparedConstellation,
  labelMeta: ReadonlyMap<string, ConstellationLabelMeta> | undefined,
): PreparedConstellation {
  if (!labelMeta || labelMeta.size === 0) return prepared;
  const nodeList = prepared.nodeList.map((node) => {
    const registry = labelMeta.get(node.id);
    if (!registry) return node;
    return {
      ...node,
      icon: registry.icon ?? node.icon,
      summary: registry.summary?.trim() || node.summary,
      meta: [...(node.meta ?? []), ...(registry.meta ?? [])],
    };
  });
  return { ...prepared, nodeList };
}
