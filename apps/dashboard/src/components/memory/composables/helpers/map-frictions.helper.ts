import type { MemoryFrictionRecord } from '@/api/memory.api';

import type { ConstellationFriction } from '../../memory-constellation/MemoryConstellation.types';

/**
 * Project friction records into the constellation warning-edge shape, keeping
 * only OPEN frictions — resolved/dismissed pairs are historical and no longer
 * contested, so they render nothing.
 */
export function mapFrictions(
  records: readonly MemoryFrictionRecord[],
): ConstellationFriction[] {
  return records
    .filter((record) => record.status === 'open')
    .map((record) => ({
      source: record.source,
      target: record.target,
      reason: record.reason,
    }));
}
