import type { MemoryCognitionProfile } from './memory-cognition.model.js';

export interface PruneProfileTopicOutcome {
  /** The pruned document — the SAME reference when nothing matched, so callers persist only on a hit. */
  profile: MemoryCognitionProfile;
  /** The stored value/key that was removed — undefined when the path matched nothing. */
  removed?: string;
}
