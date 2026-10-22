import type { MemoryPoint } from '@triplef/agent/tools';

/**
 * Wire contract of the cognition lane (`/api/v1/memory/cognition*`,
 * `/api/v1/memory/search/convictions`, and the cognition-flagged
 * `DELETE /memory/text`). The memory app owns the wire; DTO mirrors are
 * annotated per type. The shared delete receipt lives in
 * memory-partition-records.service.types.ts (that lane owns the endpoint).
 */

/**
 * Mirror of `MemoryCognitionSnapshotDto` (memory-cognition/dtos) — the AI's
 * cognition snapshot. Items reuse the shared `MemoryPoint` shape (the
 * package's declared mirror of the app's memory item).
 */
export interface MemoryCognitionSnapshot {
  /** The structured profile document (JSON text) — null when nothing learned yet. */
  profile: string | null;
  /** Derived insight records (newest first). */
  insights: MemoryPoint[];
  /** Conviction records — the AI's synthesized conclusions (evidence-cited). */
  convictions: MemoryPoint[];
  /** Effective episode probe limit (system variable) — max episode records injected per turn. */
  episodeProbeLimit: number;
}

/** Conviction search request (`POST /memory/search/convictions`) — one cognition scope's conviction records. */
export interface SearchConvictionsInput {
  /** The cognition space key. */
  memoryCognition: string;
  /** Query text; embedded by the memory app. */
  text: string;
  /** Max conviction hits. */
  limit?: number;
}

/** Targeted cognition delete (`DELETE /memory/text` with the cognition lane flag) — the memory-cognition-delete tool. */
export interface DeleteCognitionRecordsInput {
  /** The cognition space key. */
  memoryCognition: string;
  /** One verbatim insight text. */
  text?: string;
  /** One profile routing path (e.g. `likes.jazz`). */
  path?: string;
}

/** Cognition-lane delete result (the memory-cognition-delete tool surface). */
export interface DeleteCognitionRecordsOutcome {
  /** Number of insight records deleted. */
  deleted: number;
  /** The removed insight texts. */
  texts: string[];
  /** Routing paths pruned from the profile document. */
  pruned: string[];
}
