import type { ClusterPoint } from '../../../../helpers/detect-clusters.helper.js';

/** Most common category among members — the summary prompt's naming hint. */
export function modalCategory(members: ClusterPoint[]): string | undefined {
  const counts = new Map<string, number>();
  for (const member of members) {
    const category = member.category?.trim();
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [category, count] of counts) {
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }
  return best;
}
