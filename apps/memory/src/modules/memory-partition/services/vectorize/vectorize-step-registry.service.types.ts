import type { VectorizeStepId } from './vectorize-context.types.js';
import type { VectorizeStepHandler } from './vectorize-step.types.js';

/** The step table the vectorize step engine walks: handler plus per-step dependency list. */
export type VectorizeStepRegistry = Map<
  VectorizeStepId,
  {
    /** The step's work unit. */
    handler: VectorizeStepHandler;
    /** Steps that must complete before this one runs. */
    deps: VectorizeStepId[];
  }
>;
