export interface ConversationTurn {
  sessionId: string;
  conversationId: string;
  requestId: string;
  title?: string;
  content: Record<string, unknown>;
}

export interface ConversationSnapshot {
  id?: string;
  conversationId: string;
  title?: string | null;
  updatedAt?: Date;
  type?: 'temporary' | 'persistent';
  event?: string;
  roomId?: string;
  numCtx?: string;
  stream?: boolean;
  subscriptions?: Array<{ event: string; roomId: string }>;
  contextUsagePercent?: string | null;
}

export interface MergedConversation {
  sessionId: string;
  conversationId: string;
  latestRequestId?: string;
  title?: string | null;
  content: Record<string, unknown>;
  updatedAt?: Date;
}
