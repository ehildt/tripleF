import type { MemoryFriction } from '../../../../generated/prisma/client.js';
import type {
  MemoryFrictionKind,
  MemoryFrictionStatus,
} from '../memory-friction.repository.js';

/** Project a friction row into the dashboard edge shape. */
export function mapFrictionRowToEdge(row: MemoryFriction) {
  return {
    source: row.source,
    target: row.target,
    kind: row.kind as MemoryFrictionKind,
    status: row.status as MemoryFrictionStatus,
    reason: row.reason ?? undefined,
    resolution: row.resolution ?? undefined,
  };
}
