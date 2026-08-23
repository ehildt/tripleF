export interface ConversationMetadataImage {
  name: string;
  hash: string;
}

/**
 * Merge-request payload carried through sessionMetadata: the request ids of
 * the exchanges the user selected to consolidate into one unified response.
 */
export interface ConversationMetadataMerge {
  fromRequestIds: string[];
}

export interface ConversationMetadata {
  images?: ConversationMetadataImage[];
  merge?: ConversationMetadataMerge;
}

export interface FormQueryOptions {
  requestId: string;
  sessionId: string;
  /** Memory partition override (sysctl → system); empty/undefined = the session id is the partition. */
  memoryPartition?: string;
  /** Memory cognition override (sysctl → system); empty/undefined = the memory partition is the cognition space. */
  memoryCognition?: string;
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
