import { createHash } from 'node:crypto';

/** One undirected link edge (any kind) — the detection input. */
interface ClusterEdge {
  source: string;
  target: string;
}

/** One memory point — the detection input (vector for absorption). */
export interface ClusterPoint {
  id: string;
  vector: number[];
  text: string;
  category?: string;
  tags: string[];
}

/** One detected cluster (a cluster of related points). */
interface DetectedCluster {
  /** Deterministic id — the `cluster_id` written onto member points. */
  id: string;
  /** Hash of the sorted member ids — the membership-drift signal. */
  fingerprint: string;
  memberIds: string[];
  memberCount: number;
}

/** Detection output: clusters plus the every-point assignment. */
interface ClusterDetection {
  clusters: DetectedCluster[];
  /** pointId → clusterId — every input point is assigned exactly one. */
  assignments: Map<string, string>;
}

/** Cap on member vectors compared per singleton absorption (bounded cost). */
const ABSORPTION_MEMBER_CAP = 20;

/**
 * Detect clusters over a scope's link graph and assign EVERY point to
 * exactly one cluster (no lone facts):
 *
 * 1. Connected components over the edges (union-find) — components of at
 *    least `minMembers` become structural clusters.
 * 2. Singletons (components below the threshold) are absorbed into their
 *    NEAREST structural cluster by cosine similarity against member
 *    vectors — the graph's own structure decides where a lone fact belongs.
 * 3. Cold scopes with no structural clusters (no edges, or all
 *    singletons) fall back to category grouping: each category is a
 *    cluster, and uncategorized points each form their own (last resort).
 *
 * Deterministic: fingerprints hash the sorted member ids, ids hash the scope
 * seed + fingerprint, so a re-run over unchanged data yields identical ids.
 */
export function detectClusters(params: {
  edges: ClusterEdge[];
  points: ClusterPoint[];
  minMembers: number;
  scopeSeed: string;
  /**
   * Cold-scope category grouping (default true). Upper hierarchy levels
   * (Raptor synopses) pass false: unrelated synopses must not be forced
   * together by a category label — no structural clusters = stop recursing.
   */
  allowCategoryFallback?: boolean;
}): ClusterDetection {
  // Sort points by id first — Qdrant scroll order is not stable, and the
  // absorb order below changes membership (→ fingerprints → re-summarization),
  // so the whole run must be deterministic for a given point+edge set.
  const points = [...params.points].sort((a, b) => a.id.localeCompare(b.id));
  const pointIds = new Set(points.map((point) => point.id));
  const roots = unionFind(params.edges, pointIds);

  // Group points by their component root.
  const groups = new Map<string, ClusterPoint[]>();
  for (const point of points) {
    const root = roots.get(point.id) ?? point.id;
    const group = groups.get(root) ?? [];
    group.push(point);
    groups.set(root, group);
  }

  const structural: ClusterPoint[][] = [];
  const singletons: ClusterPoint[] = [];
  for (const group of groups.values()) {
    if (group.length >= params.minMembers) structural.push(group);
    else singletons.push(...group);
  }

  // Cold scope: no structural clusters → category fallback guarantees
  // every point still lands in a cluster (leaf level only — upper Raptor
  // levels disable it and stop the recursion instead).
  if (structural.length === 0) {
    if (params.allowCategoryFallback === false) {
      return { clusters: [], assignments: new Map() };
    }
    return buildCategoryClusters(points, params.scopeSeed);
  }

  // Absorb each singleton into its nearest structural cluster FIRST — the
  // absorption changes the cluster's membership (and thus its fingerprint
  // and id), so clusters and assignments must be built AFTER absorption.
  for (const singleton of singletons) {
    const nearest = nearestCluster(singleton, structural);
    if (nearest) {
      structural[nearest.index].push(singleton);
    } else {
      // No vector to compare — last resort: its own cluster.
      structural.push([singleton]);
    }
  }

  const clusters: DetectedCluster[] = structural.map((members) =>
    buildCluster(members, params.scopeSeed),
  );
  const assignments = new Map<string, string>();
  for (const cluster of clusters) {
    for (const memberId of cluster.memberIds) {
      assignments.set(memberId, cluster.id);
    }
  }

  return { clusters, assignments };
}

/** Union-find over the edges, restricted to known point ids. */
function unionFind(
  edges: ClusterEdge[],
  pointIds: Set<string>,
): Map<string, string> {
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root) ?? root;
    // Path compression.
    let current = id;
    while (parent.get(current) !== root) {
      const next = parent.get(current) ?? root;
      parent.set(current, root);
      current = next;
    }
    return root;
  };
  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    const rankA = rank.get(ra) ?? 0;
    const rankB = rank.get(rb) ?? 0;
    if (rankA < rankB) parent.set(ra, rb);
    else if (rankA > rankB) parent.set(rb, ra);
    else {
      parent.set(rb, ra);
      rank.set(ra, rankA + 1);
    }
  };

  for (const id of pointIds) parent.set(id, id);
  for (const edge of edges) {
    if (pointIds.has(edge.source) && pointIds.has(edge.target)) {
      union(edge.source, edge.target);
    }
  }
  return parent;
}

/** Build one cluster record from its members (sorted, deterministic). */
function buildCluster(
  members: ClusterPoint[],
  scopeSeed: string,
): DetectedCluster {
  const memberIds = members.map((member) => member.id).sort();
  const fp = fingerprint(memberIds);
  return {
    id: clusterId(scopeSeed, fp),
    fingerprint: fp,
    memberIds,
    memberCount: memberIds.length,
  };
}

/** Category fallback: group by category; uncategorized points go solo. */
function buildCategoryClusters(
  points: ClusterPoint[],
  scopeSeed: string,
): ClusterDetection {
  const byCategory = new Map<string, ClusterPoint[]>();
  const uncategorized: ClusterPoint[] = [];
  for (const point of points) {
    const category = point.category?.trim();
    if (category) {
      const group = byCategory.get(category) ?? [];
      group.push(point);
      byCategory.set(category, group);
    } else {
      uncategorized.push(point);
    }
  }

  const clusters: DetectedCluster[] = [];
  const assignments = new Map<string, string>();
  for (const members of byCategory.values()) {
    const cluster = buildCluster(members, scopeSeed);
    clusters.push(cluster);
    for (const memberId of cluster.memberIds) {
      assignments.set(memberId, cluster.id);
    }
  }
  for (const point of uncategorized) {
    const solo = buildCluster([point], scopeSeed);
    clusters.push(solo);
    assignments.set(point.id, solo.id);
  }
  return { clusters, assignments };
}

/** Nearest structural cluster to a singleton (cosine against members). */
function nearestCluster(
  singleton: ClusterPoint,
  structural: ClusterPoint[][],
): { index: number } | undefined {
  if (
    !Array.isArray(singleton.vector) ||
    typeof singleton.vector[0] !== 'number'
  ) {
    return undefined;
  }
  let bestIndex = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < structural.length; i++) {
    const members = structural[i].slice(0, ABSORPTION_MEMBER_CAP);
    let score = -Infinity;
    for (const member of members) {
      if (
        !Array.isArray(member.vector) ||
        typeof member.vector[0] !== 'number'
      ) {
        continue;
      }
      const similarity = cosineSimilarity(singleton.vector, member.vector);
      if (similarity > score) score = similarity;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex >= 0 ? { index: bestIndex } : undefined;
}

/**
 * Cosine similarity between two equal-length vectors (the absorption pass and
 * the Raptor pairwise synopsis-edge builder share it).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Hash of the sorted member ids — the membership-drift signal. */
function fingerprint(memberIds: string[]): string {
  return createHash('sha256').update(memberIds.join('\n')).digest('hex');
}

/** Deterministic cluster id from the scope seed + fingerprint. */
function clusterId(scopeSeed: string, fp: string): string {
  return createHash('sha256').update(`${scopeSeed}|${fp}`).digest('hex');
}
