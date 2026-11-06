import type { MemoryPoint } from '../models/memory.model.js';

export interface ScrollSynthesizableInput {
  /** Partition containing the evidence records. */
  memoryPartition: string;
  /** Maximum number of evidence records returned. */
  limit: number;
}

export interface MemorySynthesisPoint {
  /** Evidence point id. */
  id: string;
  /** Dense vector of the evidence record. */
  vector: number[];
  /** Stored evidence text. */
  text: string;
  /** Turn role of the evidence record. */
  role: MemoryPoint['role'];
  /** Storage timestamp as an ISO string. */
  createdAt: string;
  /** Category label assigned during extraction. */
  category?: string;
  /** Subject label assigned during extraction. */
  subject?: string;
  /** Community label assigned during extraction. */
  community?: string;
  /** Kind label assigned during extraction. */
  kind?: string;
  /** Stability label assigned during extraction. */
  stability?: string;
}

export interface MemorySynthesisRecord {
  /** Synthesized bridge or conviction point id. */
  id: string;
  /** Evidence-point ids cited by the synthesized statement. */
  evidenceIds: string[];
}

export interface MemorySupersededState {
  /** Evidence point id found in the collection. */
  id: string;
  /** Whether the evidence point has been marked superseded. */
  superseded: boolean;
}
