import type { MemoryPoint } from '../models/memory.model.js';

/** Boundary of the memory collection reads: dashboard listing entries and
 * the dedupe/linking scroll projection. Shapes mirror the stored memory
 * point payload (`memory.model.ts`), reduced to the fields each read needs. */

/** One leaf row of the dashboard's label drill listing. */
export interface MemoryLabelLeafRow {
  /** Leaf point id. */
  id: string;
  /** The leaf's stored text the row renders. */
  text: string;
  /** Whether the leaf sits in the constellation link graph. */
  isLinked: boolean;
  /** Storage timestamp (ISO string). */
  createdAt: string;
}

/**
 * One point read back with its vector — the dedupe and linking sweep input.
 * Partial mirror of the memory point payload: only the fields those sweeps
 * score on.
 */
export interface MemoryScrolledPoint {
  /** Leaf point id. */
  id: string;
  /** Dense vector of the point. */
  vector: number[];
  /** Stored text. */
  text: string;
  /** Turn role of the memory (mirrors `MemoryPoint.role`). */
  role: MemoryPoint['role'];
  /** Stored tag labels. */
  tags: string[];
  /** Storage timestamp (ISO string). */
  createdAt: string;
  /** Originating request id when known. */
  requestId?: string;
  /** Canonical subject label when classified. */
  subject?: string;
  /** Canonical community label when classified. */
  community?: string;
  /** Kind label when classified. */
  kind?: string;
  /** Stability label when classified. */
  stability?: string;
}
