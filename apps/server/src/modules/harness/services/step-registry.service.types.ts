import type { StepId } from './harness-context.type.js';
import type { StepHandler } from './harness-step.interface.js';

/** The step table the harness engine walks: handler plus per-step dependency list. */
export type StepRegistry = Map<
  StepId,
  {
    /** The step's work unit. */
    handler: StepHandler;
    /** Steps that must complete before this one runs. */
    deps: StepId[];
  }
>;
