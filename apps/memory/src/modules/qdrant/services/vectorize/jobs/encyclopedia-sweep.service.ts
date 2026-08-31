import { Injectable, Logger } from '@nestjs/common';

import { EncyclopediaLedgerRepository } from '../../../../persistence/services/encyclopedia-ledger.repository.js';
import type { EncyclopediaSweepJobData } from '../../../models/memory.model.js';
import { EncyclopediaRepository } from '../../encyclopedia.repository.js';

/** Hard cap on pending documents processed per run (mirrors the memory sweep). */
const MAX_PENDING_PER_RUN = 500;

/**
 * Encyclopedia supersede sweep job handler (vectorize queue): heals orphaned
 * old-hash chunks left by a crashed supersede. Deterministic — for each
 * pending ledger row, if the url's current stored hash differs from the
 * row's hash, delete the superseded chunks; then mark swept. No model, no
 * adjudication: sourced chunks carry provenance, so cross-url duplicates are
 * never merged or deleted here (dedupe happens at retrieval time).
 *
 * Failure philosophy (matches the memory sweep): Qdrant/Postgres errors
 * propagate to BullMQ (retry); rows are marked swept only after processing,
 * so a crash mid-run resumes from the oldest unswept row.
 */
@Injectable()
export class EncyclopediaSweepService {
  private readonly logger = new Logger(EncyclopediaSweepService.name);

  constructor(
    private readonly ledger: EncyclopediaLedgerRepository,
    private readonly repository: EncyclopediaRepository,
  ) {}

  async execute(data: EncyclopediaSweepJobData): Promise<void> {
    const limit = Math.min(data.limit ?? 100, MAX_PENDING_PER_RUN);
    const pending = await this.ledger.listPending(limit);
    if (pending.length === 0) {
      this.logger.debug('encyclopedia-consolidate: nothing pending');
      return;
    }

    let healed = 0;
    for (const row of pending) {
      const existing = await this.repository.scrollByUrl(row.url);
      const currentHash = latestHash(existing);
      if (currentHash && currentHash !== row.contentHash) {
        if (data.dryRun) {
          this.logger.log(
            `encyclopedia-consolidate [dryRun]: would heal ${row.url} (${row.contentHash} → ${currentHash})`,
          );
          continue;
        }
        await this.repository.deleteByUrlExcludingHash(row.url, currentHash);
        healed++;
      }
    }

    if (!data.dryRun) {
      await this.ledger.markSwept(pending.map((row) => row.id));
    }

    this.logger.log(
      `encyclopedia-consolidate: processed ${pending.length} — healed ${healed} superseded documents${data.dryRun ? ' (dryRun)' : ''}`,
    );
  }
}

/** The newest content hash among a url's stored chunks (by fetched_at). */
function latestHash(
  existing: Array<{ contentHash: string; fetchedAt: string }>,
): string | undefined {
  if (existing.length === 0) return undefined;
  return existing.reduce((newest, chunk) =>
    chunk.fetchedAt > newest.fetchedAt ? chunk : newest,
  ).contentHash;
}
