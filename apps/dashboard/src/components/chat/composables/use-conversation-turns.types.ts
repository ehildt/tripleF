import type { Exchange } from '@/stores/chat/conversation/conversation.model';

export interface ConversationTurnSeed {
  /** Internal parent/store conversation id receiving the turn. */
  conversationStoreId: string;
  /** User/assistant records to append without generated local id/timestamp. */
  exchanges: Array<Omit<Exchange, 'id' | 'timestamp'>>;
  /** Model selected for this turn and subsequent conversation defaults. */
  model: string;
  /** Effective context-window setting for the conversation. */
  numCtx: string;
  /** Effective reasoning effort for the conversation. */
  think: string;
  /** Whether the harness response is streamed. */
  stream: boolean;
  /** Socket event bound to the conversation. */
  event: string;
  /** Socket room bound to the conversation. */
  roomId: string;
  /** Whether to apply the turn's model/socket settings to the record. */
  patchConfiguration: boolean;
  /** Localized placeholder used when the first prompt supplies the title. */
  defaultTitle: string;
}

export interface ConversationRetryPreparation {
  /** Internal parent/store conversation id being prepared. */
  conversationStoreId: string;
  /** Stable harness request/job id being retried. */
  requestId: string;
  /** Stable/server conversation id stamped onto seeded exchanges. */
  serverConversationId: string;
  /** Model selected for the retry. */
  model: string;
  /** Socket event selected for the retry. */
  event: string;
  /** Socket room selected for the retry. */
  roomId: string;
  /** Effective context-window setting for the retry. */
  numCtx: string;
  /** Effective reasoning effort for the retry. */
  think: string;
  /** Whether the retry response is streamed. */
  stream: boolean;
  /** User prompt to seed when the failed turn is absent, if available. */
  failedPrompt?: string;
  /** Localized placeholder used when a seeded prompt supplies the title. */
  defaultTitle: string;
}
