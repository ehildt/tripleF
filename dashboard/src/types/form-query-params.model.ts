export interface ConversationMetadataImage {
  name: string;
  hash: string;
}

export interface ConversationMetadata {
  images?: ConversationMetadataImage[];
}

export interface FormQueryOptions {
  requestId: string;
  sessionId: string;
  conversationId?: string;
  roomId: string;
  stream: boolean;
  event: string;
  numCtx: string;
  think: string;
  hasNewImages?: boolean;
  conversationMetadata?: ConversationMetadata | null;
  /** Active UI locale (browser-detected or user-selected), e.g. 'de'. */
  language?: string;
}
