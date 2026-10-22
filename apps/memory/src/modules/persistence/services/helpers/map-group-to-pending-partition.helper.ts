import type { PendingLedgerPartition } from '../memory-insert-ledger.repository.types.js';

/** One ledger group-by row as returned by Prisma. */
interface PendingPartitionGroup {
  /** The grouped partition key. */
  memoryPartition: string;
  /** Aggregate bucket carrying the group count. */
  _count: { _all: number };
}

/** Project a group-by row into the pending-partition shape. */
export function mapGroupToPendingPartition(
  group: PendingPartitionGroup,
): PendingLedgerPartition {
  return {
    memoryPartition: group.memoryPartition,
    pending: group._count._all,
  };
}
