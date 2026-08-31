import type { MemoryLexiconInsertLedger } from '../../../../generated/prisma/client.js';

/** Project a lexicon ledger row into the pending-entry shape. */
export function mapLexiconLedgerRowToPending(row: MemoryLexiconInsertLedger) {
  return {
    id: row.id,
    url: row.url,
    contentHash: row.contentHash,
    chunkCount: row.chunkCount,
    partitionScope: row.partitionScope,
    title: row.title ?? undefined,
    requestId: row.requestId ?? undefined,
    createdAt: row.createdAt,
  };
}
