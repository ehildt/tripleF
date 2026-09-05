import { getMemoryApiUrl } from './api-url';

/** One alias of a taxonomy node (the killed-wording audit trail). */
export interface MemoryTaxonomyAliasRecord {
  alias: string;
  source: string;
  score?: number;
  createdAt: string;
}

/** One taxonomy node with its operational metadata (server aggregation). */
export interface MemoryTaxonomyNodeRecord {
  id: string;
  /** 'cluster' | 'community' | 'hub' | 'tag'. */
  kind: string;
  /** Parent node id ('' on cluster roots and flat tags). */
  parentId: string;
  name: string;
  icon?: string;
  summary?: string;
  createdBy: string;
  leafCount: number;
  linkedCount: number;
  childCount: number;
  aliases: MemoryTaxonomyAliasRecord[];
  lastReflectedAt?: string;
  lastConsolidatedAt?: string;
  lastRelinkedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Read one scope's macro-taxonomy (cluster → community → hub, plus the tag
 * vocabulary) with per-node metadata. Throws on failure so the caller can
 * degrade to an undecorated constellation (the taxonomy layer is optional
 * chrome, never a blocker for the graph itself).
 */
export async function fetchMemoryTaxonomy(
  lane: 'partition' | 'encyclopedia',
  scopeKey: string,
): Promise<MemoryTaxonomyNodeRecord[]> {
  const res = await fetch(
    getMemoryApiUrl(
      `/api/v1/qdrant/memory/taxonomy?lane=${encodeURIComponent(lane)}&scopeKey=${encodeURIComponent(scopeKey)}`,
    ),
  );
  if (!res.ok) throw new Error(`Failed to load memory taxonomy: ${res.status}`);
  const body = (await res.json()) as { nodes?: MemoryTaxonomyNodeRecord[] };
  return Array.isArray(body.nodes) ? body.nodes : [];
}

/** Rename a taxonomy node and/or set/clear its icon (user action). */
export async function updateMemoryTaxonomyNode(
  id: string,
  update: { name?: string; icon?: string | null },
): Promise<void> {
  const res = await fetch(
    getMemoryApiUrl(`/api/v1/qdrant/memory/taxonomy/${encodeURIComponent(id)}`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to update taxonomy node: ${res.status}`);
  }
}

/** Merge one taxonomy node into another (same scope + tier; user action). */
export async function mergeMemoryTaxonomyNode(
  id: string,
  into: string,
): Promise<void> {
  const res = await fetch(
    getMemoryApiUrl(
      `/api/v1/qdrant/memory/taxonomy/${encodeURIComponent(id)}/merge`,
    ),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ into }),
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to merge taxonomy node: ${res.status}`);
  }
}
