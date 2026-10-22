import type { Prisma } from '../../../../generated/prisma/client.js';
import type {
  MemoryTaxonomyKind,
  MemoryTaxonomyLane,
} from '../../constants/memory-taxonomy.constant.js';
import type { MemoryTaxonomyNodeRecord } from '../memory-taxonomy.repository.types.js';

/** Map a Prisma row to the repository record (nulls → undefined). */
export function mapTaxonomyNodeToRecord(
  row: Prisma.MemoryTaxonomyNodeGetPayload<object>,
): MemoryTaxonomyNodeRecord {
  return {
    ...row,
    kind: row.kind as MemoryTaxonomyKind,
    lane: row.lane as MemoryTaxonomyLane,
    icon: row.icon ?? undefined,
    summary: row.summary ?? undefined,
    lastReflectedAt: row.lastReflectedAt ?? undefined,
    lastConsolidatedAt: row.lastConsolidatedAt ?? undefined,
    lastRelinkedAt: row.lastRelinkedAt ?? undefined,
  };
}
