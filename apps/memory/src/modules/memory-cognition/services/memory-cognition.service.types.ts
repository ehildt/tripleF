/**
 * Boundary of the cognition lane: the per-scope routing fields every
 * cognition write carries.
 */

/** The cognition space a write targets, plus its provenance scope. */
export interface CognitionScope {
  /** The AI's cognition space key. */
  memoryCognition: string;
  /** Originating partition session, when known. */
  sessionId?: string;
  /** Originating conversation, when known. */
  conversationId?: string;
  /** Harness turn id — traces every cognition write back to the user request. */
  requestId?: string;
}

/**
 * One synthesized statement with its evidence back-references — the claim
 * plus the point ids it was distilled from. Mirrors the useful projection
 * of the conviction-synthesis verdict statements
 * (`parse-conviction-synthesis.helper.ts`); bridge statements carry the
 * same projection.
 */
export interface CognitionSynthesisStatement {
  /** The distilled claim text. */
  text: string;
  /** Point ids of the evidence the claim was distilled from. */
  evidenceIds: string[];
}

/**
 * Targeted per-item cognition delete: partial mirror of the
 * memory-cognition-delete tool's wire input (`MemoryDeleteQueryDto`),
 * carrying only the fields this service acts on.
 */
export interface CognitionDeleteInput {
  /** The AI's cognition space key (never anonymous). */
  memoryCognition: string;
  /** Verbatim insight text to remove, when the matcher is a text. */
  text?: string;
  /** Profile routing path to prune (e.g. "likes.jazz"), when the matcher is a path. */
  path?: string;
}

/**
 * Result of a targeted per-item cognition delete: full mirror of the
 * `MemoryDeleteResponseDto` wire response, including the pruned profile
 * topics.
 */
export interface CognitionDeleteResult {
  /** Number of memory points deleted (0 when nothing matched). */
  deleted: number;
  /** Verbatim texts of the removed records. */
  texts: string[];
  /** Routing topics pruned from the profile document. */
  pruned: string[];
}
