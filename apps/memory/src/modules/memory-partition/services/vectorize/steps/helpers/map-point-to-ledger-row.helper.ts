import type { MemoryRole } from '../../../../../qdrant/models/memory.model.js';

/** Project a stored point into a ledger row. */
export function mapPointToLedgerRow(
  point: { id: string; text: string },
  memoryPartition: string,
  role: MemoryRole,
  requestId: string | undefined,
) {
  return {
    memoryPartition,
    pointId: point.id,
    role,
    text: point.text,
    requestId,
  };
}
