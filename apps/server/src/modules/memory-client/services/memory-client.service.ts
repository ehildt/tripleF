import { Inject, Injectable } from '@nestjs/common';
import type {
  LexiconSelectInput,
  LexiconSelectResult,
  LexiconSourceDocument,
} from '@triplef/agent/schemas';
import type { MemoryPoint } from '@triplef/agent/tools';

import type { MemoryClientConfig } from '../configs/memory-client-config.adapter.js';
import { MEMORY_CLIENT_CONFIG } from '../constants/memory-client.constants.js';

interface MemoryCognitionSnapshot {
  /** The structured profile document (JSON text) — null when nothing learned yet. */
  profile: string | null;
  /** Derived insight records (newest first). */
  insights: Array<{ text: string; path?: string }>;
  /** Effective episode probe limit (system variable) — max episode records injected per turn. */
  episodeProbeLimit: number;
}

interface MemoryOverridesConfig {
  cognitionLimit: number;
  baseline: number;
  overridden: boolean;
  episodeRecencyWeight: number;
  episodeRecencyScaleSeconds: number;
  episodeRecencyMidpoint: number;
  episodeProbeLimit: number;
  episodeScoreThreshold: number;
}

interface SearchByTextInput {
  memoryPartition?: string;
  sessionId?: string;
  text: string;
  tags?: string[];
  contains?: string;
  limit?: number;
  /** Blend recency into the ranking (episode probe). */
  recency?: boolean;
}

interface StoreRecordInput {
  memoryPartition: string;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  text: string;
  tags?: string[];
  /** Broad category (e.g. `games`, `pets`) — the constellation community tier key. */
  category?: string;
}

interface StoreInsightInput {
  memoryCognition: string;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  text: string;
  path?: string;
}

interface DeleteRecordsInput {
  memoryPartition: string;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  text?: string;
  contains?: string;
  tags?: string[];
}

interface DeleteRecordsOutcome {
  deleted: number;
  texts: string[];
  matched: number;
}

/**
 * HTTP client for the outsourced memory app (the qdrant/vector-memory
 * service). Every method mirrors the memory app's REST surface
 * (/api/v1/qdrant/*) and the failure semantics of the services it replaces:
 * read paths degrade to empty results so the harness never breaks on memory,
 * write paths throw so the memory tools can report honest failures.
 */
@Injectable()
export class MemoryClientService {
  constructor(
    @Inject(MEMORY_CLIENT_CONFIG) private readonly config: MemoryClientConfig,
  ) {}

  get baseUrl(): string {
    return `${this.config.url}/api/v1`;
  }

  /** Qdrant collection status (health probes). */
  async status(): Promise<unknown> {
    return this.request(`${this.baseUrl}/qdrant/status`);
  }

  /** Semantic text search — read path of the memory-partition-recall tool + sanitize probe. */
  async searchByText(input: SearchByTextInput): Promise<MemoryPoint[]> {
    if (!this.config.enabled) return [];
    try {
      return await this.request<MemoryPoint[]>(
        `${this.baseUrl}/qdrant/search/text`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch {
      // Memory is a background concern — a store outage must not break the turn.
      return [];
    }
  }

  /**
   * Ephemeral retrieval selection: rank fetched source passages against the
   * query and return the budget-filled verbatim chunks. Null on any failure
   * (disabled, outage, 503) — the harness falls back to full references.
   */
  async selectContext(
    input: LexiconSelectInput,
  ): Promise<LexiconSelectResult | null> {
    if (!this.config.enabled) return null;
    try {
      return await this.request<LexiconSelectResult>(
        `${this.baseUrl}/lexicon/select`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return null;
    }
  }

  /**
   * Index uploaded documents into the shared lexicon (persist-only, no
   * selection). Fire-and-forget: a lexicon outage must never break the turn.
   */
  async indexLexiconDocuments(input: {
    documents: LexiconSourceDocument[];
    partitionScope?: string;
  }): Promise<{ storedDocs: number; reusedDocs: number } | null> {
    if (!this.config.enabled) return null;
    try {
      return await this.request<{ storedDocs: number; reusedDocs: number }>(
        `${this.baseUrl}/lexicon/index`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return null;
    }
  }

  /** The AI's cognition snapshot (structured profile + derived insights). */
  async getCognition(
    memoryCognition: string,
  ): Promise<MemoryCognitionSnapshot> {
    return this.request<MemoryCognitionSnapshot>(
      `${this.baseUrl}/qdrant/memory/cognition?memoryCognition=${encodeURIComponent(memoryCognition)}`,
    );
  }

  /** The memory app's system variables (sysctl → system) — effective values over env defaults. */
  async getOverrides(): Promise<MemoryOverridesConfig> {
    return this.request<MemoryOverridesConfig>(
      `${this.baseUrl}/memory-overrides`,
    );
  }

  /** Sync store of one fact record (the memory-partition-remember tool) — returns the point id. */
  async storeRecord(input: StoreRecordInput): Promise<string> {
    if (!this.config.enabled) throw new Error('Memory feature is disabled');
    const res = await this.request<{ accepted: boolean; id?: string }>(
      `${this.baseUrl}/qdrant/text`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    if (!res.accepted || !res.id) {
      throw new Error('Memory store was not accepted');
    }
    return res.id;
  }

  /**
   * Sync store of one derived insight (the memory-cognition-remember tool)
   * into the AI's cognition space — returns the point id.
   */
  async storeInsight(input: StoreInsightInput): Promise<string> {
    if (!this.config.enabled) throw new Error('Memory feature is disabled');
    const res = await this.request<{ accepted: boolean; id?: string }>(
      `${this.baseUrl}/qdrant/memory/cognition/insights`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
    if (!res.accepted || !res.id) {
      throw new Error('Cognition store was not accepted');
    }
    return res.id;
  }

  /** Filtered record delete (the memory-partition-delete tool) — no fuzzy wipes. */
  async deleteRecords(
    input: DeleteRecordsInput,
  ): Promise<DeleteRecordsOutcome> {
    if (!this.config.enabled) throw new Error('Memory feature is disabled');
    const params = new URLSearchParams();
    params.set('memoryPartition', input.memoryPartition);
    if (input.sessionId) params.set('sessionId', input.sessionId);
    if (input.conversationId)
      params.set('conversationId', input.conversationId);
    if (input.requestId) params.set('requestId', input.requestId);
    if (input.text) params.set('text', input.text);
    if (input.contains) params.set('contains', input.contains);
    if (input.tags?.length) params.set('tags', input.tags.join(','));
    const res = await this.request<{ deleted: number; texts: string[] }>(
      `${this.baseUrl}/qdrant/text?${params.toString()}`,
      { method: 'DELETE' },
    );
    return { deleted: res.deleted, texts: res.texts, matched: res.deleted };
  }

  /** Wipe the AI's cognition space (profile + insights) for one partition. */
  async deleteCognition(memoryCognition: string): Promise<string[]> {
    const params = new URLSearchParams({
      memoryPartition: memoryCognition,
      cognition: 'true',
    });
    const res = await this.request<{ deleted: number; texts: string[] }>(
      `${this.baseUrl}/qdrant/text?${params.toString()}`,
      { method: 'DELETE' },
    );
    return res.texts;
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
      throw new Error(`Memory service error ${res.status} for ${url}`);
    }
    return res.json() as Promise<T>;
  }
}
