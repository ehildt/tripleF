import type {
  ConversationSubscription,
  Exchange,
  SavedFileInfo,
  UploadedImage,
} from '../stores/conversation.model';

export interface ConversationContent {
  id: string;
  title?: string;
  model?: string;
  numCtx?: string;
  think?: string;
  stream?: boolean;
  event?: string;
  roomId?: string;
  type?: 'temporary' | 'persistent';
  task?: string;
  conversationId: string;
  exchanges: Exchange[];
  savedFileInfos?: SavedFileInfo[];
  uploadedImages?: UploadedImage[];
  imageSelectionSnapshot?: Record<string, boolean>;
  subscriptions?: ConversationSubscription[];
  createdAt?: number;
  updatedAt?: number;
  contextUsagePercent?: string | null;
}

export interface ConversationSnapshot {
  id?: string;
  conversationId: string;
  title?: string | null;
  updatedAt?: string;
  type?: 'temporary' | 'persistent';
  event?: string;
  roomId?: string;
  numCtx?: string;
  stream?: boolean;
  subscriptions?: ConversationSubscription[];
  contextUsagePercent?: string | null;
}

export interface MergedConversation {
  sessionId: string;
  conversationId: string;
  latestRequestId?: string;
  title?: string | null;
  content: ConversationContent;
  updatedAt?: string;
}
