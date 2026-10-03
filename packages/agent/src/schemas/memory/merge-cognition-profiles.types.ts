import type { MemoryCognitionProfile } from './memory-cognition.model.js';

/** Outcome of resolving a model-authored patch over the stored profile document. */
export interface MergedCognitionProfile {
  /** The document to persist; undefined when the patch yields no effective change (skip the write). */
  profile?: MemoryCognitionProfile;
  /** Top-level fields the patch deleted (null-valued keys) — surfaced for logging. */
  removals: string[];
}
