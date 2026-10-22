import { Injectable } from '@nestjs/common';
import type { MemoryPoint } from '@triplef/agent/tools';

import { EMPTY_MEMORY_COGNITION_SNAPSHOT } from '../constants/memory-client.constants.js';

import { buildDeleteFilterQuery } from './helpers/build-delete-filter-query.helper.js';
import type {
  DeleteCognitionRecordsInput,
  DeleteCognitionRecordsOutcome,
  MemoryCognitionSnapshot,
  SearchConvictionsInput,
} from './memory-cognition.service.types.js';
import { MemoryHttpTransportService } from './memory-http-transport.service.js';
import type { DeleteTextReceipt } from './memory-partition-records.service.types.js';

/**
 * Cognition lane (`/memory/cognition*`, `/memory/search/convictions`, and
 * the cognition-flagged `DELETE /memory/text`): the AI's own memory space —
 * profile snapshot, conviction probe, insight/profile deletes. Probe reads
 * degrade to empty so a memory outage never breaks a turn; deletes throw so
 * the tools report honest failures. Insight writes happen in the memory
 * app's per-turn profile job, never through this client.
 */
@Injectable()
export class MemoryCognitionService {
  constructor(private readonly transport: MemoryHttpTransportService) {}

  /**
   * The AI's cognition snapshot (structured profile + derived insights).
   * Degrades to an empty snapshot on any failure — the same shape a fresh
   * cognition space returns, so probes continue with no personalization.
   */
  async getCognition(
    memoryCognition: string,
  ): Promise<MemoryCognitionSnapshot> {
    if (!this.transport.enabled) return EMPTY_MEMORY_COGNITION_SNAPSHOT;
    try {
      return await this.transport.request<MemoryCognitionSnapshot>(
        `${this.transport.baseUrl}/memory/cognition?memoryCognition=${encodeURIComponent(memoryCognition)}`,
      );
    } catch {
      return EMPTY_MEMORY_COGNITION_SNAPSHOT;
    }
  }

  /**
   * Semantic search over one cognition scope's conviction records — the
   * sanitize probe's conviction read path.
   */
  async searchConvictions(
    input: SearchConvictionsInput,
  ): Promise<MemoryPoint[]> {
    if (!this.transport.enabled) return [];
    try {
      return await this.transport.request<MemoryPoint[]>(
        `${this.transport.baseUrl}/memory/search/convictions`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return [];
    }
  }

  /** Wipe the AI's cognition space (profile + insights) for one partition (the memory-cognition-forget tool). */
  async deleteCognition(memoryCognition: string): Promise<string[]> {
    const res = await this.transport.request<DeleteTextReceipt>(
      `${this.transport.baseUrl}/memory/text?${buildDeleteFilterQuery({
        memoryPartition: memoryCognition,
        cognition: true,
      })}`,
      { method: 'DELETE' },
    );
    return res.texts;
  }

  /**
   * Targeted cognition delete (the memory-cognition-delete tool): one
   * verbatim insight text and/or one profile routing path ("likes.jazz") —
   * the per-item counterpart to the deleteCognition wipe.
   */
  async deleteCognitionRecords(
    input: DeleteCognitionRecordsInput,
  ): Promise<DeleteCognitionRecordsOutcome> {
    if (!this.transport.enabled) throw new Error('Memory feature is disabled');
    const res = await this.transport.request<DeleteTextReceipt>(
      `${this.transport.baseUrl}/memory/text?${buildDeleteFilterQuery({
        memoryPartition: input.memoryCognition,
        cognition: true,
        text: input.text,
        path: input.path,
      })}`,
      { method: 'DELETE' },
    );
    return { deleted: res.deleted, texts: res.texts, pruned: res.pruned ?? [] };
  }
}
