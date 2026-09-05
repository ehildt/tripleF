import { mapEncyclopediaChunk } from './helpers/map-encyclopedia-chunk.helper';
import { mapFact } from './helpers/map-fact.helper';
import { mapInsight } from './helpers/map-insight.helper';
import { getMemoryApiUrl } from './api-url';

export interface MemoryCognitionSnapshot {
  /** The structured profile document (JSON text) — null when nothing learned yet. */
  profile: string | null;
  /** Derived insight records (topic-probed at respond time), newest listing order. */
  insights: Array<{
    id: string;
    text: string;
    path?: string;
    isConsolidated?: boolean;
    isReflected?: boolean;
    isFriction?: boolean;
    superseded?: boolean;
    supersededBy?: string;
  }>;
  /**
   * Conviction records — the AI's synthesized conclusions about the
   * user/self model (evidence ids cite the partition facts they rest on).
   */
  convictions: Array<{
    id: string;
    text: string;
    evidenceIds?: string[];
    isReflected?: boolean;
    isFriction?: boolean;
    superseded?: boolean;
    supersededBy?: string;
  }>;
}

/**
 * Read the AI's cognition space for a key (`memory_cognition` lane): the
 * structured profile document (Postgres, serialized JSON) plus the derived
 * insight and conviction records (Qdrant, path-routed into the profile).
 * Throws on failure so the caller can surface an unavailable state (feature
 * off or the store down).
 */
export async function fetchMemoryCognition(
  cognitionKey: string,
): Promise<MemoryCognitionSnapshot> {
  const res = await fetch(
    getMemoryApiUrl(
      `/api/v1/qdrant/memory/cognition?memoryCognition=${encodeURIComponent(cognitionKey)}`,
    ),
  );
  if (!res.ok)
    throw new Error(`Failed to load memory cognition: ${res.status}`);
  const body = (await res.json()) as {
    profile?: string | null;
    insights?: Array<{
      id?: string;
      text?: string;
      path?: string;
      isConsolidated?: boolean;
      isReflected?: boolean;
      isFriction?: boolean;
      superseded?: boolean;
      supersededBy?: string;
    }>;
    convictions?: Array<{
      id?: string;
      text?: string;
      evidenceIds?: string[];
      isReflected?: boolean;
      isFriction?: boolean;
      superseded?: boolean;
      supersededBy?: string;
    }>;
  };
  return {
    profile: body.profile ?? null,
    insights: (body.insights ?? [])
      .filter((insight) => insight.text)
      .map(mapInsight),
    convictions: (body.convictions ?? [])
      .filter((conviction) => conviction.text)
      .map((conviction) => ({
        id: conviction.id ?? '',
        text: conviction.text as string,
        evidenceIds: conviction.evidenceIds,
        isReflected: conviction.isReflected,
        isFriction: conviction.isFriction,
        superseded: conviction.superseded,
        supersededBy: conviction.supersededBy,
      })),
  };
}

/** One stored fact record of the user's memory partition. */
export interface MemoryFactRecord {
  /** Qdrant point id — the stable constellation node id. */
  id: string;
  text: string;
  /** ISO timestamp of the record — shown as a day prefix in the listing. */
  createdAt?: string;
  /** Topic labels written by the extraction pass — the constellation cluster key. */
  tags?: string[];
  /** Turn side this record originated from. */
  role?: string;
  /**
   * Broad category written by the remember tool (e.g. `games`, `pets`) —
   * the cold-scope fallback cluster key when the server has not clustered yet.
   */
  category?: string;
  /** Plural sub-family under the category — the constellation community tier. */
  community?: string;
  /** Server-detected cluster id (written by the memory-cluster job) — the authoritative cluster key. */
  clusterId?: string;
  /** The entity the fact is about — extraction-classified (the maintenance same-subject rule). */
  subject?: string;
  /** What kind of durable thing this is — extraction-classified (preference, decision, state, …). */
  kind?: string;
  /** Whether a newer statement is expected to replace this one (`durable` | `volatile`). */
  stability?: string;
  /** True once the consolidation sweep adjudicated this record. */
  isConsolidated?: boolean;
  /** True once the record has at least one constellation link edge. */
  isLinked?: boolean;
  /** True once the reflection pass reviewed this record. */
  isReflected?: boolean;
  /** True while the record is involved in an open friction. */
  isFriction?: boolean;
  /** True when a friction resolution marked this record stale. */
  superseded?: boolean;
  /** Record id that superseded this one. */
  supersededBy?: string;
  /** Point ids this bridge cites as its supporting evidence (bridge/conviction records only). */
  evidenceIds?: string[];
}

/**
 * Read the fact records of a memory partition (the user's fact space — the
 * `memoryPartition` lane): statements the user made or asked to be
 * remembered, distinct from the AI's cognition lane. Returns the first page
 * (endpoint cap 100). Throws on failure so the caller can degrade.
 */
export async function fetchMemoryFacts(
  partitionKey: string,
  limit = 5000,
): Promise<MemoryFactRecord[]> {
  const res = await fetch(
    getMemoryApiUrl(
      `/api/v1/qdrant/memory?memoryPartition=${encodeURIComponent(partitionKey)}&limit=${encodeURIComponent(limit)}`,
    ),
  );
  if (!res.ok) throw new Error(`Failed to load memory facts: ${res.status}`);
  const items = (await res.json()) as Array<{
    id?: string;
    text?: string;
    createdAt?: string;
    tags?: string[];
    role?: string;
    category?: string;
    clusterId?: string;
    subject?: string;
    kind?: string;
    stability?: string;
    isConsolidated?: boolean;
    isLinked?: boolean;
    isReflected?: boolean;
    isFriction?: boolean;
    superseded?: boolean;
    supersededBy?: string;
    evidenceIds?: string[];
  }>;
  return items.filter((item) => item.text).map(mapFact);
}

/**
 * Prune the whole fact partition via DELETE /qdrant/memory — fact records
 * ONLY (the AI cognition lane has its own wipe). Returns the number of
 * removed records (0 when the partition was empty).
 */
export async function wipeMemoryFacts(partitionKey: string): Promise<number> {
  const res = await fetch(
    getMemoryApiUrl(
      `/api/v1/qdrant/memory?memoryPartition=${encodeURIComponent(partitionKey)}`,
    ),
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(`Failed to wipe memory facts: ${res.status}`);
  const body = (await res.json()) as { deleted: number };
  return body.deleted;
}

/**
 * Wipe the AI's whole cognition space for a key (profile + insights) via
 * DELETE /qdrant/text in cognition mode. Returns the number of removed
 * records (0 when the space was empty).
 */
export async function wipeMemoryCognition(
  cognitionKey: string,
): Promise<number> {
  const res = await fetch(
    getMemoryApiUrl(
      `/api/v1/qdrant/text?memoryPartition=${encodeURIComponent(cognitionKey)}&cognition=true`,
    ),
    { method: 'DELETE' },
  );
  if (!res.ok)
    throw new Error(`Failed to wipe memory cognition: ${res.status}`);
  const body = (await res.json()) as { deleted: number };
  return body.deleted;
}

/** One stored encyclopedia chunk — a verbatim passage of a fetched source document. */
export interface EncyclopediaChunkRecord {
  id: string;
  content: string;
  url: string;
  domain: string;
  title?: string;
  fetchedAt: string;
  contentHash: string;
  chunkIndex: number;
  chunkCount: number;
  partitionScope: string;
  /** Mime type of the original upload (uploaded documents only). */
  mimeType?: string;
  /** Byte size of the original upload (uploaded documents only). */
  sizeBytes?: number;
  /** Content hash of the ORIGINAL upload — the MinIO object identity (uploaded documents only). */
  originalHash?: string;
  /** Broad family label (e.g. games) — the cold-scope fallback cluster key. */
  category?: string;
  /** Narrow topic label (e.g. wuthering waves) — the constellation topic tier. */
  topic?: string;
  /** Plural sub-family under the category — the constellation community tier. */
  community?: string;
  /** Server-detected cluster id (written by the memory-cluster job) — the authoritative cluster key. */
  clusterId?: string;
  /** True once the supersede sweep adjudicated this chunk. */
  isConsolidated?: boolean;
  /** True once the chunk has at least one constellation link edge. */
  isLinked?: boolean;
  /** True once the reflection pass reviewed this chunk. */
  isReflected?: boolean;
  /** True while the chunk is involved in an open friction. */
  isFriction?: boolean;
  /** True when a friction resolution marked this chunk stale. */
  superseded?: boolean;
  /** Chunk id that superseded this one. */
  supersededBy?: string;
}

/**
 * Read the shared knowledge encyclopedia (the `memory-encyclopedia` lane): verbatim
 * chunks of fetched web content, grouped by category and topic. Returns the
 * first page (endpoint cap 1000). Throws on failure so the caller can degrade.
 */
export async function fetchEncyclopediaChunks(
  limit = 500,
): Promise<EncyclopediaChunkRecord[]> {
  const res = await fetch(
    getMemoryApiUrl(`/api/v1/encyclopedia?limit=${encodeURIComponent(limit)}`),
  );
  if (!res.ok) throw new Error(`Failed to load encyclopedia: ${res.status}`);
  const items = (await res.json()) as Array<{
    id?: string;
    content?: string;
    url?: string;
    domain?: string;
    title?: string;
    fetchedAt?: string;
    contentHash?: string;
    chunkIndex?: number;
    chunkCount?: number;
    partitionScope?: string;
    category?: string;
    clusterId?: string;
    topic?: string;
    mimeType?: string;
    sizeBytes?: number;
    originalHash?: string;
    isConsolidated?: boolean;
    isLinked?: boolean;
    isReflected?: boolean;
    isFriction?: boolean;
    superseded?: boolean;
    supersededBy?: string;
  }>;
  return items
    .filter((item) => item.content && item.url)
    .map(mapEncyclopediaChunk);
}

/** One semantic link edge between two memory points (cosine kNN). */
export interface MemoryLinkRecord {
  source: string;
  target: string;
  score: number;
  /**
   * Edge kind: 'semantic' = enforced kNN link; 'topical' = suggested link
   * written by the relink job (rendered faintly, never enforced);
   * 'evidence' = a bridge's citation edge to a fact it synthesizes.
   */
  kind?: 'semantic' | 'topical' | 'evidence';
}

/**
 * Read the semantic kNN link graph of one memory lane (cosine neighbors
 * above the link threshold). Throws on failure so the caller can degrade.
 */
export async function fetchMemoryLinks(scope: {
  memoryPartition?: string;
  memoryCognition?: string;
}): Promise<MemoryLinkRecord[]> {
  const params = new URLSearchParams();
  if (scope.memoryPartition)
    params.set('memoryPartition', scope.memoryPartition);
  if (scope.memoryCognition)
    params.set('memoryCognition', scope.memoryCognition);
  const res = await fetch(
    getMemoryApiUrl(`/api/v1/qdrant/memory/links?${params}`),
  );
  if (!res.ok) throw new Error(`Failed to load memory links: ${res.status}`);
  return (await res.json()) as MemoryLinkRecord[];
}

/**
 * Read the semantic kNN link graph of the shared knowledge encyclopedia. Throws
 * on failure so the caller can degrade.
 */
export async function fetchEncyclopediaLinks(): Promise<MemoryLinkRecord[]> {
  const res = await fetch(getMemoryApiUrl('/api/v1/encyclopedia/links'));
  if (!res.ok)
    throw new Error(`Failed to load encyclopedia links: ${res.status}`);
  return (await res.json()) as MemoryLinkRecord[];
}

/** One friction record between two memory points (the reflection pass's conflict pair). */
export interface MemoryFrictionRecord {
  source: string;
  target: string;
  kind: 'contradiction' | 'superseded' | 'outdated' | 'disagreement';
  status: 'open' | 'resolved' | 'dismissed';
  /** LLM-written description of the conflict. */
  reason?: string;
  /** How the friction was resolved (which point won, why). */
  resolution?: string;
}

/** One detected cluster — a group of related points with its LLM summary. */
export interface MemoryClusterRecord {
  id: string;
  lane: string;
  scopeKey: string;
  fingerprint: string;
  title: string;
  summary: string;
  memberCount: number;
  memberIds: string[];
  /** Hierarchy level (Raptor): 0 = leaf cluster; 1+ = cluster of synopses. */
  level?: number;
  /** Parent cluster id at level+1 (absent on the top level). */
  parentId?: string;
}

/**
 * Read the detected clusters of a memory partition (groups of related
 * facts with LLM-written title + summary). Returns [] when the cluster job
 * has not run yet (cold scope). Throws on failure so the caller can degrade.
 */
export async function fetchMemoryClusters(
  partitionKey: string,
): Promise<MemoryClusterRecord[]> {
  const res = await fetch(
    getMemoryApiUrl(
      `/api/v1/qdrant/memory/clusters?memoryPartition=${encodeURIComponent(partitionKey)}`,
    ),
  );
  if (!res.ok) throw new Error(`Failed to load memory clusters: ${res.status}`);
  return (await res.json()) as MemoryClusterRecord[];
}

/**
 * Read the detected clusters of the shared knowledge encyclopedia. Returns
 * [] when the cluster job has not run yet. Throws on failure so the caller
 * can degrade.
 */
export async function fetchEncyclopediaClusters(): Promise<
  MemoryClusterRecord[]
> {
  const res = await fetch(getMemoryApiUrl('/api/v1/encyclopedia/clusters'));
  if (!res.ok)
    throw new Error(`Failed to load encyclopedia clusters: ${res.status}`);
  return (await res.json()) as MemoryClusterRecord[];
}

/**
 * Read the friction records of one memory lane (partition facts or cognition
 * insights). Throws on failure so the caller can degrade.
 */
export async function fetchMemoryFrictions(scope: {
  memoryPartition?: string;
  memoryCognition?: string;
}): Promise<MemoryFrictionRecord[]> {
  const params = new URLSearchParams();
  if (scope.memoryPartition)
    params.set('memoryPartition', scope.memoryPartition);
  if (scope.memoryCognition)
    params.set('memoryCognition', scope.memoryCognition);
  const res = await fetch(
    getMemoryApiUrl(`/api/v1/qdrant/memory/frictions?${params}`),
  );
  if (!res.ok)
    throw new Error(`Failed to load memory frictions: ${res.status}`);
  return (await res.json()) as MemoryFrictionRecord[];
}

/**
 * Read the friction records of the shared knowledge encyclopedia. Throws on
 * failure so the caller can degrade.
 */
export async function fetchEncyclopediaFrictions(): Promise<
  MemoryFrictionRecord[]
> {
  const res = await fetch(getMemoryApiUrl('/api/v1/encyclopedia/frictions'));
  if (!res.ok)
    throw new Error(`Failed to load encyclopedia frictions: ${res.status}`);
  return (await res.json()) as MemoryFrictionRecord[];
}
