import { createHash } from 'node:crypto';

/**
 * Deterministic UUID from a seed string. BullMQ retries re-run a job; the
 * same seed always yields the same point id, so a retried job overwrites its
 * own points instead of duplicating them (Qdrant upserts are idempotent by id).
 */
export function deterministicPointId(seed: string): string {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
