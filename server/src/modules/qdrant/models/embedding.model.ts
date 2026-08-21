/**
 * Which side of a retrieval pair a text being embedded represents. The prefix
 * applied to stored documents differs from the one applied to queries — that
 * asymmetry is part of how instruction-tuned embedders were trained.
 */
export type EmbeddingRole = 'query' | 'document';

/**
 * Documented task-prefix format for an instruction-tuned embedding model
 * family, straight from its model card. Modern embedders (EmbeddingGemma,
 * Nomic v1.5/v2) are trained with prefixes prepended to every input; omitting
 * them degrades retrieval silently (no error, worse similarity).
 */
export interface EmbeddingPromptFormat {
  /** Case-insensitive substring that identifies the family in an Ollama name. */
  family: string;
  /** Prefix prepended to retrieval queries (e.g. "task: search result | query: "). */
  queryPrefix: string;
  /** Prefix prepended to stored documents/chunks (e.g. "title: none | text: "). */
  documentPrefix: string;
}
