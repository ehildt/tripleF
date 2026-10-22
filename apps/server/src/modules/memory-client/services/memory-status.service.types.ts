/**
 * Wire contract of the memory-app status lane (`/api/v1/memory/status`).
 * The memory app owns the wire — mirror of `MemoryStatusResponseDto`
 * (apps/memory: qdrant/dtos/memory-status.dto.ts).
 */

/** Qdrant collection status for the server's readiness probe. */
export interface MemoryStatusResult {
  /** Whether the memory feature is enabled (MEMORY_ENABLED). */
  enabled: boolean;
  /** Configured Qdrant collection name. */
  collection: string;
  /** Collection name resolved with the embedding-model namespace. */
  resolvedCollection: string;
  /** Embedding model used by the vectorize pipeline. */
  embedModel: string;
  /** Whether the embedding model is pulled on the Ollama host. */
  embedModelAvailable?: boolean;
  /** Configured fallback vector size (used when the model probe fails). */
  vectorSize: number;
  /** Vector size actually stored by the collection, when it exists. */
  collectionVectorSize?: number;
  /** Whether the resolved collection exists. */
  exists: boolean;
  /** Approximate point count in the collection. */
  pointsCount: number;
  /** Payload keyword indexes present on the collection. */
  indexes: string[];
}
