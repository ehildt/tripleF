import type { ConversationMetadata } from '@/types/form-query-params.model';

export interface BuildSubmitQueryParamsOptions {
  /** Client request id correlating the response with the request. */
  requestId: string;
  /** Session id; empty when no conversation is active. */
  sessionId: string;
  /** Memory partition override (settings → system); empty = the session id is the partition. */
  memoryPartition: string;
  /** Cognition space override (settings → system); empty = cognition lives in the memory partition. */
  memoryCognition: string;
  /** Conversation id forwarded to the harness. */
  conversationId: string;
  /** Socket room the request belongs to. */
  roomId: string;
  /** Conversation stream setting; defaults to true. */
  stream?: boolean;
  /** Socket event name. */
  event: string;
  /** Conversation context size; empty lets the server use its default. */
  numCtx?: string;
  /** Conversation think level; defaults to 'medium'. */
  think?: string;
  /** Whether the request carries newly uploaded images. */
  hasNewImages: boolean;
  /** Conversation metadata (images/documents/merge) carried with the request. */
  conversationMetadata?: ConversationMetadata;
  /** Active UI locale, e.g. 'en'. */
  language: string;
}
