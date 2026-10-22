/**
 * Boundary of the memory insert ledger: the write-side audit-trail rows and
 * the pending (unswept) projection the consolidation sweep consumes.
 */

/** One ledger row to write — the sweep's incremental input and the write-side audit trail. */
export interface MemoryInsertLedgerRow {
  /** Fact partition the stored record belongs to. */
  memoryPartition: string;
  /** The stored record's Qdrant point id. */
  pointId: string;
  /** Turn side the record originates from. */
  role: 'user' | 'assistant';
  /** Verbatim stored text. */
  text: string;
  /** Harness turn id that produced the record. */
  requestId?: string;
}

/** A pending (unswept) ledger row, oldest-first. */
export interface PendingLedgerEntry extends MemoryInsertLedgerRow {
  /** Ledger row id. */
  id: string;
  /** When the row was inserted. */
  createdAt: Date;
}

/** One partition with pending (unswept) ledger rows, plus its pending count. */
export interface PendingLedgerPartition {
  /** Fact partition key with unswept rows. */
  memoryPartition: string;
  /** Count of unswept rows in the partition. */
  pending: number;
}
