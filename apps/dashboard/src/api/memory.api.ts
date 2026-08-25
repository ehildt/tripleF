import { getMemoryApiUrl } from './api-url';

export interface MemoryCognitionSnapshot {
  /** The structured profile document (JSON text) — null when nothing learned yet. */
  profile: string | null;
  /** Derived insight records (topic-probed at respond time), newest listing order. */
  insights: Array<{ id: string; text: string; path?: string }>;
}

/**
 * Read the AI's cognition space for a key (`memory_cognition` lane): the
 * structured profile document (Postgres, serialized JSON) plus the derived
 * insight records (Qdrant, path-routed into the profile). Throws on failure
 * so the caller can surface an unavailable state (feature off or the store
 * down).
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
    insights?: Array<{ id?: string; text?: string; path?: string }>;
  };
  return {
    profile: body.profile ?? null,
    insights: (body.insights ?? [])
      .filter((insight) => insight.text)
      .map((insight, index) => ({
        id: insight.id ?? `insight-${index}`,
        text: insight.text as string,
        path: insight.path,
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
   * the constellation community key grouping related topics.
   */
  category?: string;
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
  }>;
  return items
    .filter((item) => item.text)
    .map((item, index) => ({
      id: item.id ?? `fact-${index}`,
      text: item.text as string,
      createdAt: item.createdAt,
      tags: Array.isArray(item.tags) ? item.tags : [],
      role: item.role,
      category: item.category,
    }));
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

/** One stored lexicon chunk — a verbatim passage of a fetched source document. */
export interface LexiconChunkRecord {
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
}

/**
 * Read the shared knowledge lexicon (the `memory-lexicon` lane): verbatim
 * chunks of fetched web content, grouped by source domain. Returns the first
 * page (endpoint cap 1000). Throws on failure so the caller can degrade.
 */
export async function fetchLexiconChunks(
  limit = 500,
): Promise<LexiconChunkRecord[]> {
  const res = await fetch(
    getMemoryApiUrl(`/api/v1/lexicon?limit=${encodeURIComponent(limit)}`),
  );
  if (!res.ok) throw new Error(`Failed to load lexicon: ${res.status}`);
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
  }>;
  return items
    .filter((item) => item.content && item.url)
    .map((item) => ({
      id: item.id ?? '',
      content: item.content as string,
      url: item.url as string,
      domain: item.domain ?? '',
      title: item.title,
      fetchedAt: item.fetchedAt ?? '',
      contentHash: item.contentHash ?? '',
      chunkIndex: item.chunkIndex ?? 0,
      chunkCount: item.chunkCount ?? 0,
      partitionScope: item.partitionScope ?? '',
    }));
}

/** One semantic link edge between two memory points (cosine kNN). */
export interface MemoryLinkRecord {
  source: string;
  target: string;
  score: number;
  /**
   * Edge kind: 'semantic' = enforced kNN link; 'topical' = suggested link
   * written by the relink job (rendered faintly, never enforced).
   */
  kind?: 'semantic' | 'topical';
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
 * Read the semantic kNN link graph of the shared knowledge lexicon. Throws
 * on failure so the caller can degrade.
 */
export async function fetchLexiconLinks(): Promise<MemoryLinkRecord[]> {
  const res = await fetch(getMemoryApiUrl('/api/v1/lexicon/links'));
  if (!res.ok) throw new Error(`Failed to load lexicon links: ${res.status}`);
  return (await res.json()) as MemoryLinkRecord[];
}
