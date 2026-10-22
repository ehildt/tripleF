import type { EncyclopediaSourceDocument } from '@triplef/agent/schemas';

/**
 * Wire contract of the encyclopedia lane (`/api/v1/encyclopedia/*`). The
 * memory app owns the wire. The encyclopedia search/read/select shapes are
 * NOT mirrored here — they live in `@triplef/agent/schemas`, shared by both
 * apps, and are imported directly by the service.
 */

/** Persist-only index request (`POST /encyclopedia/index`) — uploaded documents into the shared encyclopedia. */
export interface IndexEncyclopediaDocumentsInput {
  /** The uploaded source documents. */
  documents: EncyclopediaSourceDocument[];
  /** Partition scope; the app falls back to 'global' when omitted. */
  partitionScope?: string;
}

/** One dropped upload in the encyclopedia index response (reason mirrors the app's `'oversize' | 'empty'`). */
interface DocumentRejectionRecord {
  /** The rejected document's title, when known. */
  title?: string;
  /** The rejected document's url, when known. */
  url?: string;
  /** Why the document was rejected. */
  reason: 'oversize' | 'empty';
}

/** Index response (`POST /encyclopedia/index`, mirror of the app's encyclopedia-store outcome). */
export interface IndexEncyclopediaDocumentsOutcome {
  /** Documents newly persisted. */
  storedDocs: number;
  /** Documents whose content hash matched an already-stored document. */
  reusedDocs: number;
  /** Uploads rejected by size/emptiness guards. */
  rejectedDocs: DocumentRejectionRecord[];
}
