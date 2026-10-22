import type { MemoryRole } from '../../qdrant/models/memory.model.js';

/**
 * Boundary of the consolidation adjudication: the provenance-labeled record
 * shape the shared LLM verdict pass consumes.
 */

/** One provenance-labeled record line — the adjudication input. */
export interface AdjudicationFact {
  /** Verbatim record text under judgment. */
  text: string;
  /** Turn side the record came from. */
  role: MemoryRole;
  /** When the record was stored. */
  createdAt: string;
  /** The entity the record is about — merging requires the same subject. */
  subject?: string;
  /** Broad family label — conflicts almost always live inside one family. */
  category?: string;
  /** What kind of durable thing this is (preference, state, contact, …). */
  kind?: string;
  /** Whether a newer statement is expected to replace this one. */
  stability?: string;
}
