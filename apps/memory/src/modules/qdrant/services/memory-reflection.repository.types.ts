import type { MemoryPoint } from '../models/memory.model.js';

export interface ScrollUnreflectedInput {
  /** Partition scope to inspect, when reading fact records. */
  memoryPartition?: string;
  /** Cognition scope to inspect, when reading insight records. */
  memoryCognition?: string;
  /** Optional tag restriction for the reflection queue. */
  tags?: string[];
  /** Maximum number of records returned. */
  limit: number;
}

export interface MemoryReflectionPoint {
  /** Point id. */
  id: string;
  /** Dense vector used for neighbor screening. */
  vector: number[];
  /** Stored record text. */
  text: string;
  /** Turn role of the record. */
  role: MemoryPoint['role'];
  /** Storage timestamp as an ISO string. */
  createdAt: string;
  /** Subject label used for same-subject adjudication. */
  subject?: string;
  /** Category label assigned during extraction. */
  category?: string;
  /** Community label assigned during extraction. */
  community?: string;
  /** Kind label assigned during extraction. */
  kind?: string;
  /** Stability label assigned during extraction. */
  stability?: string;
}

export interface QueryNeighborFactsInput {
  /** Partition scope to query, when screening fact records. */
  memoryPartition?: string;
  /** Cognition scope to query, when screening insight records. */
  memoryCognition?: string;
  /** Dense vector of the point being screened. */
  vector: number[];
  /** Maximum number of neighboring records returned. */
  limit: number;
  /** Minimum similarity score for a neighboring record. */
  scoreThreshold: number;
}

export interface MemoryNeighborFact {
  /** Neighboring point id. */
  id: string;
  /** Neighboring record text used as adjudication evidence. */
  text: string;
  /** Turn role of the neighboring record. */
  role: MemoryPoint['role'];
  /** Storage timestamp as an ISO string. */
  createdAt: string;
  /** Subject label assigned during extraction. */
  subject?: string;
  /** Category label assigned during extraction. */
  category?: string;
  /** Community label assigned during extraction. */
  community?: string;
  /** Kind label assigned during extraction. */
  kind?: string;
  /** Stability label assigned during extraction. */
  stability?: string;
}
