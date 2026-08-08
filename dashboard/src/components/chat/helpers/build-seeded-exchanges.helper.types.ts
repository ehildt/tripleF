import type { ConversationMetadataImage } from '@/types/form-query-params.model';

export interface SeededExchangesOptions {
  requestId: string;
  model: string;
  event: string;
  roomId: string;
  conversationId: string;
  userContent: string;
  images: ConversationMetadataImage[];
}
