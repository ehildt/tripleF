import { type IntentResult } from '@triplef/agent/schemas';
import type { ToolResult } from '@triplef/ai-sdk';
import { Job } from 'bullmq';

import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { buildChatRequest } from '../helpers/build-chat-request.helper.js';
import type { DocumentSection } from '../helpers/documents/document-section.types.js';
import type { IngestedImage } from '../helpers/media/download-and-ingest-images.types.js';

export type StepId =
  | 'interpret'
  | 'execute'
  | 'sanitize'
  | 'respond'
  | 'memoryWrite'
  | 'vectorize'
  | 'memoryProfile';

export type StepState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done' }
  | { status: 'error'; error: string };

export type HarnessContext = {
  requestId: string;
  sessionId?: string;
  /** Memory partition for this turn — the user-set partition id when configured, else the session id. */
  memoryPartition?: string;
  /** Cognition space key for this turn — the user-set cognition id when configured, else the memory partition (else the session id). */
  memoryCognition?: string;
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
  /** Storage urls of every file attached to this turn (uploads, referenced
   *  images, converted page images, document originals) — remembered by the
   *  embedding pipeline so recalled facts can point back at their files. */
  files?: Array<{ name: string; url: string }>;
  /** Extracted text of uploaded documents (docx/pptx/text) with their MinIO
   *  storage url — indexed into the encyclopedia (pure knowledge), untruncated. */
  documentSections?: DocumentSection[];
  abortSignal: AbortSignal;

  steps: Map<StepId, StepState>;
  outputs: {
    intent?: IntentResult;
    toolResults: ToolResult[];
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
