import { Job } from 'bullmq';

import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { buildChatRequest } from '../helpers/harness.helpers.js';
import { type IntentResult } from '../templates/intent.schema.js';

export type StepId = 'interpret' | 'execute' | 'respond';

export type StepState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done' }
  | { status: 'error'; error: string };

export type HarnessContext = {
  requestId: string;
  sessionId?: string;
  job: Job<HarnessJobPayload>;
  filters: HarnessJobPayload['filters'];
  model: string;
  request: ReturnType<typeof buildChatRequest>;
  processedMeta: HarnessJobPayload['meta'];
  buffers: Buffer[];
  roomId?: string;
  event?: string;
  stream: boolean;
  hasNewImages: boolean;
  visionExcluded?: boolean;
  lastUserPrompt?: string;
  abortSignal: AbortSignal;

  steps: Map<StepId, StepState>;
  outputs: {
    intent?: IntentResult;
    toolResults: Array<{ toolName: string; result: unknown }>;
    finalContent?: string;
    inputTokens?: number;
    outputTokens?: number;
  };

  done: boolean;
  doneReason?: 'clarification' | 'error';
  error?: string;
};
