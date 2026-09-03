import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  EncyclopediaDocumentInput,
  EncyclopediaDocumentResult,
  EncyclopediaSearchHit,
  EncyclopediaSearchInput,
  EncyclopediaSelectInput,
  EncyclopediaSelectResult,
  EncyclopediaSourceDocument,
} from '@triplef/agent/schemas';
import type { MemoryPoint } from '@triplef/agent/tools';

import type { MemoryClientConfig } from '../configs/memory-client-config.adapter.js';
import { MEMORY_CLIENT_CONFIG } from '../constants/memory-client.constants.js';

interface MemoryCognitionSnapshot {
  /** The structured profile document (JSON text) — null when nothing learned yet. */
  profile: string | null;
  /** Derived insight records (newest first). */
  insights: Array<{
    id: string;
    text: string;
    path?: string;
    isConsolidated?: boolean;
    isReflected?: boolean;
    isFriction?: boolean;
    superseded?: boolean;
    supersededBy?: string;
  }>;
  /** Conviction records — the AI's synthesized conclusions (evidence-cited). */
  convictions?: Array<{
    id: string;
    text: string;
  }>;
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

/** One detected cluster summary (the memory graph's cluster report). */
interface MemoryClusterRecord {
  id: string;
  lane: string;
  scopeKey: string;
  fingerprint: string;
  title: string;
  summary: string;
  memberCount: number;
  memberIds: string[];
}

/** Graph-augmented search result: hits plus their cluster summaries. */
interface SearchWithClusters {
  points: MemoryPoint[];
  clusters: MemoryClusterRecord[];
}

interface StoreRecordInput {
  memoryPartition: string;
  sessionId?: string;
  conversationId?: string;
  requestId?: string;
  text: string;
  tags?: string[];
  /** Broad category (e.g. `games`, `pets`) — the constellation cluster tier key. */
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
  private readonly logger = new Logger(MemoryClientService.name);

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
   * Graph-augmented text search: the plain kNN hits plus the cluster
   * summaries of the clusters those hits belong to — the local-search
   * context for cross-cutting questions. Degrades to empty on any failure.
   */
  async searchByTextWithClusters(
    input: SearchByTextInput,
  ): Promise<SearchWithClusters> {
    if (!this.config.enabled) return { points: [], clusters: [] };
    try {
      return await this.request<SearchWithClusters>(
        `${this.baseUrl}/qdrant/search/text/clusters`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return { points: [], clusters: [] };
    }
  }

  /**
   * Semantic search over one cognition scope's conviction records — the
   * sanitize probe's conviction read path. Degrades to an empty result so a
   * memory outage never breaks the turn.
   */
  async searchConvictions(input: {
    memoryCognition: string;
    text: string;
    limit?: number;
  }): Promise<MemoryPoint[]> {
    if (!this.config.enabled) return [];
    try {
      return await this.request<MemoryPoint[]>(
        `${this.baseUrl}/qdrant/search/convictions`,
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

  /**
   * Agentic knowledge-base search (the encyclopedia-search tool's read path)
   * — semantic search over every persisted source, optionally scoped to one
   * document url or domain. Degrades to an empty result on any failure.
   */
  async searchEncyclopedia(
    input: EncyclopediaSearchInput,
  ): Promise<EncyclopediaSearchHit[]> {
    if (!this.config.enabled) return [];
    try {
      return await this.request<EncyclopediaSearchHit[]>(
        `${this.baseUrl}/encyclopedia/search`,
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

  /**
   * Agentic document deep-dive (the encyclopedia-read tool's read path) — a
   * windowed verbatim read of one stored document, continuation via offset.
   * Degrades to null on any failure.
   */
  async readEncyclopediaDocument(
    input: EncyclopediaDocumentInput,
  ): Promise<EncyclopediaDocumentResult | null> {
    if (!this.config.enabled) return null;
    try {
      return await this.request<EncyclopediaDocumentResult | null>(
        `${this.baseUrl}/encyclopedia/document`,
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
   * Ephemeral retrieval selection: rank fetched source passages against the
   * query and return the budget-filled verbatim chunks. Null on any failure
   * (disabled, outage, 503) — the harness falls back to full references.
   */
  async selectContext(
    input: EncyclopediaSelectInput,
  ): Promise<EncyclopediaSelectResult | null> {
    if (!this.config.enabled) return null;
    try {
      return await this.request<EncyclopediaSelectResult>(
        `${this.baseUrl}/encyclopedia/select`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
    } catch (error) {
      this.logger.warn(
        `encyclopedia select failed — falling back to full references: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * Index uploaded documents into the shared encyclopedia (persist-only, no
   * selection). Fire-and-forget: a encyclopedia outage must never break the turn.
   */
  async indexEncyclopediaDocuments(input: {
    documents: EncyclopediaSourceDocument[];
    partitionScope?: string;
  }): Promise<{
    storedDocs: number;
    reusedDocs: number;
    rejectedDocs?: Array<{ title?: string; url?: string; reason: string }>;
  } | null> {
    if (!this.config.enabled) return null;
    try {
      return await this.request<{
        storedDocs: number;
        reusedDocs: number;
        rejectedDocs?: Array<{ title?: string; url?: string; reason: string }>;
      }>(`${this.baseUrl}/encyclopedia/index`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch (error) {
      this.logger.warn(
        `encyclopedia index failed — uploads not persisted: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
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
