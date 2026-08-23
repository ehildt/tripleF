import { HarnessContext } from './harness-context.type.js';

export interface StepHandler {
  execute(ctx: HarnessContext): Promise<void>;
}
