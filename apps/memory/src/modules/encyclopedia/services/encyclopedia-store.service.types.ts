import type { EncyclopediaSourceDocument } from '@triplef/agent/schemas';

/**
 * Boundary of the encyclopedia persist pass: what the select flow needs to
 * know about which documents were stored, reused, or kept ephemeral.
 */

/** Outcome of the persist pass — what the select flow needs to know. */
export interface PersistOutcome {
  /** Documents already indexed under the same hash (dedupe hits). */
  reusedDocs: number;
  /** Documents newly chunked, embedded, and indexed. */
  storedDocs: number;
  /** All current-turn urls (persisted + oversize-rejected) — Lane B exclusion. */
  currentUrls: string[];
  /** Urls present in the index — Lane A vector query filter. */
  indexedUrls: string[];
  /** Docs to chunk+embed in-memory (no url, or rejected). */
  ephemeralDocs: EncyclopediaSourceDocument[];
  /**
   * Docs rejected from the index with a reason (oversize, or empty after
   * chunking). In the select flow these still serve the turn in-memory
   * (ephemeralDocs); the persist-only index flow surfaces them as drops.
   */
  rejectedDocs: Array<{
    /** Document title, when known. */
    title?: string;
    /** Document url, when the doc had one. */
    url?: string;
    /** Why the doc was rejected: payload oversize, or nothing left after chunking. */
    reason: 'oversize' | 'empty';
  }>;
}
