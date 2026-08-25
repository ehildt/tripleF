import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import { buildCollectionName } from '../helpers/collection-name.helper.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { EmbeddingService } from './embedding.service.js';

/**
 * Thin owner of the Qdrant REST client instance and its one-time bootstrap.
 *
 * The collection is namespaced by the embedding model (`{base}_{model}`, see
 * `buildCollectionName`), because each embedding model owns a different vector
 * space — switching models must create a fresh collection, never mix spaces.
 * Its vector size is probed from the live model at bootstrap (one embed call)
 * instead of trusting a hardcoded dimension; when the probe fails the
 * configured size is the fallback.
 *
 * Bootstrap (gated on `MEMORY_ENABLED`): creates the collection if missing and
 * ensures the payload keyword indexes — including the space identity keys
 * (`memory_partition`, `memory_cognition`) with `is_tenant: true`, Qdrant's
 * multitenancy-by-payload pattern that co-locates one space's
 * vectors for sequential reads. Indexes must exist before any data is
 * ingested, so they are created here at module init, never lazily on write.
 *
 * A failed bootstrap (Qdrant not running, wrong URL, …) is logged and
 * swallowed: the memory feature degrades to empty reads/writes and the health
 * indicator reports the outage — the harness itself never breaks.
 */
@Injectable()
export class QdrantClientService implements OnModuleInit {
  private readonly logger = new Logger(QdrantClientService.name);
  private client: QdrantClient | null = null;

  constructor(
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.log(
        'Memory feature disabled (MEMORY_ENABLED=false) — skipping Qdrant bootstrap',
      );
      return;
    }
    try {
      let modelDims: number | undefined;
      try {
        modelDims = await this.embeddingService.embedDimension();
      } catch (error) {
        this.logger.warn(
          `Embedding model "${this.config.embedModel}" not reachable at boot — ` +
            `using configured vector size ${this.config.vectorSize}: ${
              error instanceof Error ? error.message : String(error)
            }`,
        );
      }
      await this.ensureCollection(modelDims);
      await this.ensurePayloadIndexes();
      await this.verifyCollectionDims(modelDims);
      await this.ensureLexiconCollection(modelDims);
      await this.ensureLexiconPayloadIndexes();
    } catch (error) {
      this.logger.warn(
        `Qdrant bootstrap failed — memory reads/writes will be unavailable: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Resolved collection name (model-namespaced); every layer uses this. */
  get collection(): string {
    return buildCollectionName(this.config.collection, this.config.embedModel);
  }

  /** Resolved lexicon collection name (model-namespaced, global scope). */
  get lexiconCollection(): string {
    return buildCollectionName(
      this.config.lexiconCollection,
      this.config.embedModel,
    );
  }

  /** Lazily-created singleton client; the config is cached, so is the client. */
  getClient(): QdrantClient {
    if (!this.client) {
      const { url, apiKey } = this.config;
      this.client = new QdrantClient({ url, apiKey });
    }
    return this.client;
  }

  /**
   * Create the collection if missing (Cosine distance; vectors auto-normalize
   * on upload). The size comes from the model's real dims when known, else the
   * configured fallback.
   */
  async ensureCollection(modelDims?: number): Promise<void> {
    const client = this.getClient();
    const { exists } = await client.collectionExists(this.collection);
    if (exists) return;
    const size = modelDims ?? this.config.vectorSize;
    await client.createCollection(this.collection, {
      vectors: { size, distance: 'Cosine' },
    });
    this.logger.log(
      `Created Qdrant collection "${this.collection}" (${size} dims, Cosine)`,
    );
  }

  /**
   * Warn loudly when the live collection's dimensionality disagrees with the
   * configured model's — a sign of a model/dims mismatch that would make every
   * upsert fail or produce corrupt similarity.
   */
  async verifyCollectionDims(modelDims?: number): Promise<void> {
    if (!modelDims) return;
    const stored = await this.getCollectionVectorSize();
    if (stored === undefined) return;
    if (stored !== modelDims) {
      this.logger.error(
        `Qdrant collection "${this.collection}" stores ${stored}-dim vectors but ` +
          `embedding model "${this.config.embedModel}" produces ${modelDims} dims. ` +
          `Upserts will fail. Recreate the collection for this model.`,
      );
    }
  }

  /** Keyword indexes on every filtered payload field; the space keys use Qdrant's multitenancy marker. */
  async ensurePayloadIndexes(): Promise<void> {
    const client = this.getClient();
    const info = await client.getCollection(this.collection);
    const existing = new Set(Object.keys(info.payload_schema ?? {}));
    const indexes = [
      // memory_partition / memory_cognition are the identity keys — one point
      // belongs to exactly one space: the user's fact partition (session-
      // derived by default, or the user-set partition id from sysctl) or the
      // AI's cognition space for that user. `is_tenant` co-locates a space's
      // vectors for sequential reads (Qdrant multitenancy-by-payload).
      {
        field_name: 'memory_partition',
        field_schema: { type: 'keyword', is_tenant: true },
      },
      {
        field_name: 'memory_cognition',
        field_schema: { type: 'keyword', is_tenant: true },
      },
      { field_name: 'session_id', field_schema: 'keyword' },
      { field_name: 'role', field_schema: 'keyword' },
      { field_name: 'conversation_id', field_schema: 'keyword' },
      { field_name: 'request_id', field_schema: 'keyword' },
      // tags is an open LLM-written keyword bag — keyword schema indexes each
      // array element so `match: { any: [...] }` filters are fast.
      { field_name: 'tags', field_schema: 'keyword' },
      // category is the broad family label — keyword index powers the facet
      // inventory (relink job) and category-scoped filters.
      { field_name: 'category', field_schema: 'keyword' },
      // Full-text schema on text enables RAG-style containment filters
      // (`match: { text: ... }`) over the record content.
      { field_name: 'text', field_schema: 'text' },
      // Datetime schema on created_at powers the episode probe's recency
      // blend (formula query with exp_decay on the payload timestamp).
      { field_name: 'created_at', field_schema: 'datetime' },
    ] as const;
    for (const index of indexes) {
      if (existing.has(index.field_name)) continue;
      await client.createPayloadIndex(this.collection, {
        field_name: index.field_name,
        field_schema: index.field_schema,
        wait: true,
      });
      this.logger.log(
        `Created payload index "${index.field_name}" on "${this.collection}"`,
      );
    }
  }

  /** Reachability probe for the health indicator. */
  async ping(): Promise<void> {
    await this.getClient().getCollections();
  }

  /** True when the configured collection exists in Qdrant. */
  async hasCollection(): Promise<boolean> {
    const { exists } = await this.getClient().collectionExists(this.collection);
    return exists;
  }

  /** True when the lexicon collection exists in Qdrant. */
  async hasLexiconCollection(): Promise<boolean> {
    const { exists } = await this.getClient().collectionExists(
      this.lexiconCollection,
    );
    return exists;
  }

  /**
   * Create the lexicon collection if missing (Cosine, same model dims as the
   * episodic collection). Chunk-granularity points: one point per passage.
   */
  async ensureLexiconCollection(modelDims?: number): Promise<void> {
    const client = this.getClient();
    const { exists } = await client.collectionExists(this.lexiconCollection);
    if (exists) return;
    const size = modelDims ?? this.config.vectorSize;
    await client.createCollection(this.lexiconCollection, {
      vectors: { size, distance: 'Cosine' },
    });
    this.logger.log(
      `Created Qdrant collection "${this.lexiconCollection}" (${size} dims, Cosine)`,
    );
  }

  /**
   * Keyword/datetime/integer indexes on the lexicon payload: `url` (lookup +
   * supersede), `fetched_at` (datetime, future eviction/debug), `partition_scope`
   * (future tenant filter), `chunk_index` (integer, neighbor-expansion range
   * scrolls).
   */
  async ensureLexiconPayloadIndexes(): Promise<void> {
    const client = this.getClient();
    const info = await client.getCollection(this.lexiconCollection);
    const existing = new Set(Object.keys(info.payload_schema ?? {}));
    const indexes = [
      { field_name: 'url', field_schema: 'keyword' },
      { field_name: 'fetched_at', field_schema: 'datetime' },
      { field_name: 'partition_scope', field_schema: 'keyword' },
      { field_name: 'chunk_index', field_schema: 'integer' },
    ] as const;
    for (const index of indexes) {
      if (existing.has(index.field_name)) continue;
      await client.createPayloadIndex(this.lexiconCollection, {
        field_name: index.field_name,
        field_schema: index.field_schema,
        wait: true,
      });
      this.logger.log(
        `Created payload index "${index.field_name}" on "${this.lexiconCollection}"`,
      );
    }
  }

  /** Actual vector size stored by the collection, when it exists. */
  private async getCollectionVectorSize(): Promise<number | undefined> {
    const info = await this.getClient().getCollection(this.collection);
    return extractVectorSize(info.config.params.vectors);
  }

  /**
   * Collection status for the sysctl surface. When the feature is disabled
   * the report is returned without touching Qdrant (exists=false).
   */
  async getStatus(): Promise<{
    enabled: boolean;
    collection: string;
    resolvedCollection: string;
    embedModel: string;
    embedModelAvailable?: boolean;
    vectorSize: number;
    collectionVectorSize?: number;
    exists: boolean;
    pointsCount: number;
    indexes: string[];
  }> {
    const { enabled, collection, embedModel, vectorSize } = this.config;
    if (!enabled) {
      return {
        enabled,
        collection,
        resolvedCollection: this.collection,
        embedModel,
        vectorSize,
        exists: false,
        pointsCount: 0,
        indexes: [],
      };
    }
    const embedModelAvailable = await this.embeddingService.isModelReady();
    const client = this.getClient();
    const { exists } = await client.collectionExists(this.collection);
    if (!exists) {
      return {
        enabled,
        collection,
        resolvedCollection: this.collection,
        embedModel,
        embedModelAvailable,
        vectorSize,
        exists: false,
        pointsCount: 0,
        indexes: [],
      };
    }
    const info = await client.getCollection(this.collection);
    return {
      enabled,
      collection,
      resolvedCollection: this.collection,
      embedModel,
      embedModelAvailable,
      vectorSize,
      collectionVectorSize: extractVectorSize(info.config.params.vectors),
      exists: true,
      pointsCount: info.points_count ?? 0,
      indexes: Object.keys(info.payload_schema ?? {}),
    };
  }
}

/** Single-vector collections expose `{ size, distance }`; named vectors do not. */
function extractVectorSize(vectors: unknown): number | undefined {
  if (
    vectors &&
    typeof vectors === 'object' &&
    'size' in vectors &&
    typeof (vectors as { size: unknown }).size === 'number'
  ) {
    return (vectors as { size: number }).size;
  }
  return undefined;
}
