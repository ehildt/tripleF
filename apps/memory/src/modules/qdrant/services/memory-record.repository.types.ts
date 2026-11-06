export interface SearchMemoryBridgesInput {
  /** Partition containing the bridge records. */
  memoryPartition: string;
  /** Embedded query vector. */
  vector: number[];
  /** Maximum number of bridge records to return. */
  limit: number;
}

export interface SearchMemoryConvictionsInput {
  /** Cognition scope containing the conviction records. */
  memoryCognition: string;
  /** Embedded query vector. */
  vector: number[];
  /** Maximum number of conviction records to return. */
  limit: number;
}

export interface MemoryHeatHit {
  /** Identifier of the retrieved memory point. */
  id: string;
  /** Current retrieval count, when already present in the payload. */
  heatAmount?: number;
}

export interface DeleteMemoryConversationInput {
  /** Partition containing the conversation records. */
  memoryPartition: string;
  /** Conversation whose records should be removed. */
  conversationId: string;
}
