import type {
  EncyclopediaSearchResult,
  EncyclopediaSourceDocument,
} from '@triplef/agent/schemas';

/**
 * Boundary of the ingest triage gate: kept candidates plus what the gate
 * stripped as off-topic.
 */

/** Outcome of the ingest triage: kept items plus the dropped documents. */
export interface IngestTriageOutcome {
  /** Fetched documents kept for indexing/ephemeral use. */
  documents: EncyclopediaSourceDocument[];
  /** Search-result snippets kept. */
  searchResults: EncyclopediaSearchResult[];
  /** Documents stripped as off-topic — kept ephemeral for the live turn. */
  droppedDocuments: EncyclopediaSourceDocument[];
}
