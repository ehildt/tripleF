import type { MemoryClusterRecord } from '../../../../../persistence/services/memory-cluster.repository.types.js';

/** Fingerprint reuse lookup (`<level>|<fingerprint>` — levels never trade). */
export function existingFingerprintOf(
  existingByFingerprint: Map<string, MemoryClusterRecord>,
  level: number,
  fingerprint: string,
): MemoryClusterRecord | undefined {
  return existingByFingerprint.get(`${level}|${fingerprint}`);
}
