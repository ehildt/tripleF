import type { MemoryPoint } from '../models/memory.model.js';

/** Payload fields that can carry a taxonomy label. */
export type MemoryLabelField = 'category' | 'community' | 'subject' | 'tags';

export interface MemoryLabelCountOptions {
  /** Count only points that already belong to the constellation graph. */
  linkedOnly?: boolean;
}

/** One leaf row in the dashboard's label drill-down listing. */
export interface MemoryLabelLeafRow {
  /** Leaf point id. */
  id: string;
  /** Stored text rendered by the row. */
  text: string;
  /** Whether the leaf belongs to the constellation link graph. */
  isLinked: boolean;
  /** Storage timestamp as an ISO string. */
  createdAt: string;
}

/** One category point with the fields required by dedupe and linking sweeps. */
export interface MemoryScrolledPoint {
  /** Leaf point id. */
  id: string;
  /** Dense vector of the point. */
  vector: number[];
  /** Stored record text. */
  text: string;
  /** Turn role of the memory, mirroring MemoryPoint.role. */
  role: MemoryPoint['role'];
  /** Stored tag labels. */
  tags: string[];
  /** Storage timestamp as an ISO string. */
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
