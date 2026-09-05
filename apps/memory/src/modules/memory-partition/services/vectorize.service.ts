import { Inject, Injectable, Logger } from '@nestjs/common';

import { TaxonomyResolutionService } from '../../memory-taxonomy/services/taxonomy-resolution.service.js';
import { MemoryInsertLedgerRepository } from '../../persistence/services/memory-insert-ledger.repository.js';
import { QDRANT_CONFIG } from '../../qdrant/constants/qdrant.constants.js';
import { deterministicPointId } from '../../qdrant/helpers/deterministic-point-id.helper.js';
import { normalizeCommunity } from '../../qdrant/helpers/normalize-community.helper.js';
import { normalizeSubject } from '../../qdrant/helpers/normalize-subject.helper.js';
import type { MemoryScopeFilters } from '../../qdrant/models/memory.model.js';
import type { QdrantConfig } from '../../qdrant/models/qdrant-config.model.js';
import { EmbeddingService } from '../../qdrant/services/embedding.service.js';
import { MemoryRepository } from '../../qdrant/services/memory.repository.js';
import { MemoryEnqueueService } from '../../qdrant/services/memory-enqueue.service.js';
import { MemoryOverridesService } from '../../qdrant/services/memory-overrides.service.js';
import { normalizeCategory } from '../helpers/normalize-category.helper.js';
import { normalizeTags } from '../helpers/normalize-tags.helper.js';

/** A filtered delete removes at most this many records per call. */
const DELETE_RECORDS_CAP = 50;

/** Outcome of a filtered delete: `deleted` stays 0 when the match count exceeded the cap. */
interface DeleteRecordsOutcome {
  deleted: number;
  /** Verbatim texts of the removed records — the caller confirms exactly what is gone. */
  texts: string[];
  /** Total matches found, including when refused (callers phrase the refusal). */
  matched: number;
}

/**
 * Direct (non-queued) memory record writes and deletes. The turn pipeline
 * lives in the vectorize step machine (steps under services/vectorize/); this
 * service holds the synchronous record paths used by the agentic
 * `memory-partition-remember`/`memory-partition-delete` tools and the manual
 * text endpoints.
 * The AI's cognition document lives in MemoryCognitionService.
 */
@Injectable()
export class VectorizeService {
  private readonly logger = new Logger(VectorizeService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly memoryRepository: MemoryRepository,
    private readonly ledger: MemoryInsertLedgerRepository,
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly overrides: MemoryOverridesService,
    private readonly taxonomyResolution: TaxonomyResolutionService,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  /**
   * Synchronous single-record store (agentic `memory-partition-remember` /
   * manual ingest): one embed call, one deterministic-id point — re-stating
   * the same text overwrites in place, refreshing tags/timestamp. Returns the
   * point id; throws when the feature is off or the embed fails so the
   * calling tool can
   * surface an honest error to the model.
   */
  async storeRecord(input: {
    memoryPartition: string;
    sessionId?: string;
    conversationId?: string;
    requestId?: string;
    text: string;
    tags?: string[];
    category?: string;
    community?: string;
    subject?: string;
    icon?: string;
  }): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Memory feature is disabled');
    }
    const text = input.text?.trim();
    if (!text) throw new Error('Nothing to remember — text is empty');

    const [vector] = await this.embeddingService.embed([text], 'document');
    if (!vector) throw new Error('Embedding returned no vector');

    // Taxonomy snap (exact → alias → fuzzy → mint): the model names labels
    // freely, the registry's canonical names are what land on the point.
    const category = normalizeCategory(input.category);
    const community = normalizeCommunity(input.community);
    const subject = normalizeSubject(input.subject);
    const tags = normalizeTags(input.tags);
    const labels = [
      ...(category ? [{ kind: 'cluster' as const, label: category }] : []),
      ...(community
        ? [
            {
              kind: 'community' as const,
              label: community,
              parentRef: category,
            },
          ]
        : []),
      ...(subject
        ? [
            {
              kind: 'hub' as const,
              label: subject,
              parentRef: community ?? category,
            },
          ]
        : []),
      ...tags.map((tag) => ({ kind: 'tag' as const, label: tag })),
    ];
    const resolved = await this.taxonomyResolution.resolveLabels(
      'partition',
      input.memoryPartition,
      labels,
    );
    await this.taxonomyResolution.applyIconHint(input.icon, resolved);
    const canonical = new Map(
      resolved.map((entry) => [`${entry.kind}|${entry.input}`, entry.name]),
    );
    const resolvedCategory = category
      ? (canonical.get(`cluster|${category}`) ?? category)
      : undefined;
    const resolvedCommunity = community
      ? (canonical.get(`community|${community}`) ?? community)
      : undefined;
    const resolvedSubject = subject
      ? (canonical.get(`hub|${subject}`) ?? subject)
      : undefined;
    const resolvedTags = tags.map((tag) => canonical.get(`tag|${tag}`) ?? tag);

    const id = deterministicPointId(`${input.memoryPartition}|user|${text}`);
    await this.memoryRepository.upsertBatch({
      memoryPartition: input.memoryPartition,
      role: 'user',
      sessionId: input.sessionId,
      conversationId: input.conversationId,
      requestId: input.requestId,
      points: [
        {
          id,
          vector,
          text,
          tags: resolvedTags,
          category: resolvedCategory,
          community: resolvedCommunity,
          subject: resolvedSubject,
        },
      ],
    });
    this.logger.log(
      {
        memoryPartition: input.memoryPartition,
        requestId: input.requestId,
        pointId: id,
        text,
        tags: resolvedTags,
        category: resolvedCategory,
      },
      'memory record stored',
    );

    // Ledger + auto-trigger (warn-and-continue — a missed ledger row degrades
    // to no-sweep-coverage, never a failed store).
    try {
      await this.ledger.insertMany([
        {
          memoryPartition: input.memoryPartition,
          pointId: id,
          role: 'user',
          text,
          requestId: input.requestId,
        },
      ]);
      if (
        (await this.ledger.countPending(input.memoryPartition)) >=
        this.config.consolidateThreshold
      ) {
        const consolidateModel = this.overrides.getConsolidateModel();
        if (consolidateModel) {
          await this.memoryEnqueue.enqueueConsolidateJob({
            memoryPartition: input.memoryPartition,
            model: consolidateModel,
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        {
          memoryPartition: input.memoryPartition,
          requestId: input.requestId,
          err: error instanceof Error ? error : new Error(String(error)),
        },
        'ledger write/auto-trigger skipped',
      );
    }
    return id;
  }

  /**
   * Scoped record delete (agentic `memory-partition-delete` / REST
   * text-delete): resolve
   * the matching records inside the caller's partition, then remove them by
   * point id. Exact `text` equality is the record's identity (deterministic
   * ids make a verbatim restatement the same point); the other fields only
   * tighten the match. Deletion is refused above {@link DELETE_RECORDS_CAP}
   * matches — the caller must narrow the filters; both error paths surface
   * honestly (throw) so tools and endpoints never pretend a delete happened.
   */
  async deleteRecords(
    input: MemoryScopeFilters & { memoryPartition: string },
  ): Promise<DeleteRecordsOutcome> {
    if (!this.config.enabled) {
      throw new Error('Memory feature is disabled');
    }
    const matches = await this.memoryRepository.listMemory({
      memoryPartition: input.memoryPartition,
      sessionId: input.sessionId,
      role: input.role,
      conversationId: input.conversationId,
      requestId: input.requestId,
      tags: input.tags,
      contains: input.contains,
      text: input.text,
      limit: DELETE_RECORDS_CAP + 1,
    });
    if (matches.length > DELETE_RECORDS_CAP) {
      throw new Error(
        `Refusing to delete: more than ${DELETE_RECORDS_CAP} records match — narrow the filters (exact text, tags, or a longer contains phrase)`,
      );
    }
    if (matches.length === 0) return { deleted: 0, texts: [], matched: 0 };

    await this.memoryRepository.deleteByIds(matches.map((m) => m.id));
    return {
      deleted: matches.length,
      texts: matches.map((m) => m.text),
      matched: matches.length,
    };
  }
}
