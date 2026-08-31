import type { MemoryInsertLedger } from '../../../../generated/prisma/client.js';
import type { PendingLedgerEntry } from '../memory-insert-ledger.repository.js';

/** Project a ledger row into the pending-entry shape. */
export function mapLedgerRowToPending(
  row: MemoryInsertLedger,
): PendingLedgerEntry {
  return {
    id: row.id,
    memoryPartition: row.memoryPartition,
    pointId: row.pointId,
    role: row.role as PendingLedgerEntry['role'],
    text: row.text,
    requestId: row.requestId ?? undefined,
    createdAt: row.createdAt,
  };
}
