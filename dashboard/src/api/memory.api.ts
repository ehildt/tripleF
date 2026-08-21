import { getApiUrl } from './api-url';

export interface MemoryCognitionSnapshot {
  /** The structured profile document (JSON text) — null when nothing learned yet. */
  profile: string | null;
  /** Derived insight records (topic-probed at respond time), newest listing order. */
  insights: Array<{ text: string; path?: string }>;
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
    getApiUrl(
      `/api/v1/qdrant/memory/cognition?memoryCognition=${encodeURIComponent(cognitionKey)}`,
    ),
  );
  if (!res.ok)
    throw new Error(`Failed to load memory cognition: ${res.status}`);
  const body = (await res.json()) as MemoryCognitionSnapshot;
  return body;
}

/** One stored fact record of the user's memory partition. */
export interface MemoryFactRecord {
  text: string;
  /** ISO timestamp of the record — shown as a day prefix in the listing. */
  createdAt?: string;
}

/**
 * Read the fact records of a memory partition (the user's fact space — the
 * `memoryPartition` lane): statements the user made or asked to be
 * remembered, distinct from the AI's cognition lane. Returns the first page
 * (endpoint cap 100). Throws on failure so the caller can degrade.
 */
export async function fetchMemoryFacts(
  partitionKey: string,
): Promise<MemoryFactRecord[]> {
  const res = await fetch(
    getApiUrl(
      `/api/v1/qdrant/memory?memoryPartition=${encodeURIComponent(partitionKey)}&limit=100`,
    ),
  );
  if (!res.ok) throw new Error(`Failed to load memory facts: ${res.status}`);
  const items = (await res.json()) as Array<{
    text?: string;
    createdAt?: string;
  }>;
  return items
    .filter((item) => item.text)
    .map((item) => ({ text: item.text as string, createdAt: item.createdAt }));
}

/**
 * Prune the whole fact partition via DELETE /qdrant/memory — fact records
 * ONLY (the AI cognition lane has its own wipe). Returns the number of
 * removed records (0 when the partition was empty).
 */
export async function wipeMemoryFacts(partitionKey: string): Promise<number> {
  const res = await fetch(
    getApiUrl(
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
    getApiUrl(
      `/api/v1/qdrant/text?memoryPartition=${encodeURIComponent(cognitionKey)}&cognition=true`,
    ),
    { method: 'DELETE' },
  );
  if (!res.ok)
    throw new Error(`Failed to wipe memory cognition: ${res.status}`);
  const body = (await res.json()) as { deleted: number };
  return body.deleted;
}
