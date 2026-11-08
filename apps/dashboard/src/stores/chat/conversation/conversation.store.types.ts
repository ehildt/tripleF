import type { ConversationType, UploadedImage } from './conversation.model';

export interface ConversationContextDeletion {
  /** Images removed with this stable conversation context. */
  removedImages: UploadedImage[];
  /** Whether no other context remains and the whole record was removed. */
  recordRemoved: boolean;
  /** Conversation type captured before any record removal. */
  conversationType: ConversationType;
}
