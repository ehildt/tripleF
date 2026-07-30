import type { HarnessResponseData } from '@/types/harness-response-data.model';

import type { ConversationMetadataImage } from '../utils/build-query-params.helper';

export interface SavedFileInfo {
  name: string;
  size: number;
  type: string;
}

export interface UploadedImage {
  name: string;
  hash: string;
  uploadedAt: number;
  size?: number;
  selected?: boolean;
  conversationId: string;
  source?: 'local' | 'cloud';
}

export interface Exchange {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  requestId?: string;
  status: 'pending' | 'streaming' | 'done' | 'error';
  timestamp: number;
  model?: string;
  event?: string;
  roomId?: string;
  conversationId?: string;
  // Token data: promptEvalCount is the cumulative input token count reported
  // by Ollama for this turn. evalCount is the output tokens for this response.
  // inputTokenDelta holds the non-cumulative inputs added by this specific
  // turn so excluded exchanges can be deducted from totals correctly.
  promptEvalCount?: number;
  evalCount?: number;
  inputTokenDelta?: number;
  // Currently running tool calls for this exchange. Parallel searches are
  // tracked individually so the activity label can group them by category
  // instead of flickering through near-duplicate labels.
  toolCalls?: Array<{
    name: string;
    category?: string;
    query?: string;
    status: string;
  }>;
  // Live activity while the request is processed: the current step or tool
  // label (fallback for non-thinking models) and the streamed thinking text.
  activity?: string;
  reasoning?: string;
  included?: boolean;
  // Images that were associated with this prompt, either uploaded as new
  // files in the form data or referenced through conversation metadata.
  images?: ConversationMetadataImage[];
  harnessTemplate?: string;
  harnessData?: HarnessResponseData;
  text?: string;
}

export interface ConversationSubscription {
  event: string;
  roomId: string;
}

export type ConversationType = 'temporary' | 'persistent';

export interface Conversation {
  id: string;
  title: string;
  exchanges: Exchange[];
  files: File[];
  savedFileInfos: SavedFileInfo[];
  uploadedImages: UploadedImage[];
  imageSelectionSnapshot: Record<string, boolean>;
  conversationId: string;
  model: string;
  numCtx: string;
  think: string;
  event: string;
  roomId: string;
  stream: boolean;
  subscriptions: ConversationSubscription[];
  type: ConversationType;
  task?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PersistedConversation {
  id: string;
  title: string;
  exchanges: Exchange[];
  savedFileInfos: SavedFileInfo[];
  uploadedImages: UploadedImage[];
  imageSelectionSnapshot?: Record<string, boolean>;
  conversationId: string;
  model: string;
  numCtx: string;
  think: string;
  event: string;
  roomId: string;
  stream: boolean;
  subscriptions?: ConversationSubscription[];
  type: ConversationType;
  task?: string;
  createdAt: number;
  updatedAt: number;
}
