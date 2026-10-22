/**
 * Boundary shapes of the document-conversion lane: what original-resolution
 * needs beyond the job record itself.
 */

/** Vision context for one turn (attachments only exist under a vision model). */
export interface ResolveOriginalsVision {
  /** Turn chat model — describes selected pdf pages that lack one. */
  model?: string;
  /** False when the turn's model lacks vision (pdf pages excluded this turn). */
  ready: boolean;
}
