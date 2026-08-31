import type { MemoryExtraction } from '@triplef/agent/schemas';

import { deterministicPointId } from '../../../../helpers/deterministic-point-id.helper.js';

/** Assemble one memory point from an extracted fact. */
export function mapFactToPoint(
  fact: string,
  index: number,
  vectors: number[][],
  extraction: MemoryExtraction,
  memoryPartition: string,
  role: string,
) {
  return {
    id: deterministicPointId(`${memoryPartition}|${role}|${fact}`),
    vector: vectors[index],
    text: fact,
    tags: extraction.tags,
    // One broad family label per turn-side — groups the narrow tags into
    // one topic family for the constellation community tier and the relink
    // job's per-category passes.
    category: extraction.category,
  };
}
