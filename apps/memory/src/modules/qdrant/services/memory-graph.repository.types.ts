export interface MemoryNeighbor {
  /** Neighboring memory-point id. */
  id: string;
  /** Similarity score assigned by Qdrant. */
  score: number;
  /** Category label used to distinguish intra- and inter-category links. */
  category?: string;
  /** Tags used by the shared-tag relatedness rule. */
  tags: string[];
}

export interface MemoryGraphPoint {
  /** Memory-point id whose edges are being synchronized. */
  id: string;
  /** Dense vector used to find semantic neighbors. */
  vector: number[];
  /** Evidence-point ids linked explicitly by synthesized records. */
  evidenceIds?: string[];
}
