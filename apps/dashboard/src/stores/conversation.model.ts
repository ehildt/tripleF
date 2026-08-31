import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';
import type { HarnessResponseData } from '@/types/harness-response-data.model';

import type {
  ConversationMetadataDocument,
  ConversationMetadataImage,
} from '../types/form-query-params.model';

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
  /** Hash of the source pdf this page image was rendered from (pdf pages only). */
  parentHash?: string;
  /** Display name of the source pdf (pdf pages only). */
  parentName?: string;
  /** 1-based page number within the source pdf (pdf pages only). */
  page?: number;
}

/** A document attached to a conversation. The server converts it (pdf →
 * page images, other documents → extracted text); the client only keeps the
 * reference for preview and cross-turn re-injection by hash. */
export interface UploadedDocument {
  name: string;
  hash: string;
  /** MIME type of the original file (server picks the converter from it). */
  type: string;
  uploadedAt: number;
  size?: number;
  selected?: boolean;
  conversationId: string;
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
  // descriptor (fallback for non-thinking models) and the streamed thinking
  // text. `activity` is a structured i18n key + meta, localized by the client
  // in `activityLanguage` (the language the model chose to respond in).
  activity?: HarnessActivityDescriptor;
  activityLanguage?: string;
  reasoning?: string;
  included?: boolean;
  /**
   * Merge bookkeeping: `mergeOrigin` lists the request ids of the exchanges
   * this pair consolidated (set on the merged pair's user exchange at submit
   * time), and `mergedInto` carries the request id of the merge that consumed
   * this exchange (set on the source exchanges once the merged response
   * completed). No DB schema impact — the fields are JSON-tolerant. */
  mergeOrigin?: string[];
  mergedInto?: string;
  // Images that were associated with this prompt, either uploaded as new
  // files in the form data or referenced through conversation metadata.
  images?: ConversationMetadataImage[];
  // Documents attached to this prompt (docx/pptx/txt/…): the bubble renders
  // a tile per entry; the extracted text rides in the prompt content.
  documents?: ConversationMetadataDocument[];
  harnessTemplate?: string;
  harnessData?: HarnessResponseData;
  text?: string;
  /**
   * Chart data streamed from EODHD tools right after they run, keyed by tool
   * name. Buffered here but hidden until the respond step starts streaming.
   */
  chartData?: Record<string, unknown>;
  /** True once the respond step emits its first delta — reveal the charts. */
  revealCharts?: boolean;
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
  uploadedDocuments: UploadedDocument[];
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
  /** Stored context-usage percentage ("30.00") so the sidebar shows it without
   * loading the full conversation. Recalculated and persisted on prompt changes. */
  contextUsagePercent?: string | null;
  /** Client-only flag: true once the full content has been fetched from the server. */
  loaded: boolean;
}

export interface PersistedConversation {
  id: string;
  title: string;
  exchanges: Exchange[];
  savedFileInfos: SavedFileInfo[];
  uploadedImages: UploadedImage[];
  uploadedDocuments: UploadedDocument[];
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
  contextUsagePercent?: string | null;
}
