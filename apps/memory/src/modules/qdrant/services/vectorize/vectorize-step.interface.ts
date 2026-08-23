import type { VectorizeContext } from './vectorize-context.type.js';

/** A vectorize pipeline step — mirrors the harness's StepHandler contract. */
export interface VectorizeStepHandler {
  execute(ctx: VectorizeContext): Promise<void>;
}
