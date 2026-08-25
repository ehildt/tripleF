import type {
  ConversationMetadataDocument,
  ConversationMetadataImage,
} from '@/types/form-query-params.model';

export interface SeededExchangesOptions {
  requestId: string;
  model: string;
  event: string;
  roomId: string;
  conversationId: string;
  userContent: string;
  images: ConversationMetadataImage[];
  /** Documents attached to this prompt; the bubble renders a tile per entry. */
  documents?: ConversationMetadataDocument[];
  /** Request ids of the exchanges this pair consolidates (merge submit). */
  mergeOrigin?: string[];
}
