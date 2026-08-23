import type { HarnessContext } from './harness-context.type.js';

export type StepLoggerContext =
  Pick<HarnessContext, 'requestId'> | { requestId?: string };
