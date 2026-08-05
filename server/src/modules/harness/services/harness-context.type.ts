import { Job } from 'bullmq';

import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { buildChatRequest } from '../helpers/build-chat-request.helper.js';
import type { IngestedImage } from '../helpers/download-and-ingest-images.helper.js';
import { type IntentResult } from '../templates/intent.schema.js';

export type StepId = 'interpret' | 'execute' | 'sanitize' | 'respond';

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
    ingestedForRewrite?: IngestedImage[];
    /** Model-visible (deduped) media for the client render/fallback. */
    availableImages?: Array<{ url: string; title?: string }>;
    availableVideos?: Array<{ url: string; title?: string }>;
    finalContent?: string;
    finalData?: Record<string, unknown>;
    inputTokens?: number;
    outputTokens?: number;
  };

  done: boolean;
  doneReason?: 'clarification' | 'error';
  error?: string;
};
