import type { Exchange, UploadedImage } from '../conversation.model';

export interface ConversationContextPartition {
  /** Exchanges belonging to other stable conversation contexts. */
  exchanges: Exchange[];
  /** Uploaded images belonging to other stable conversation contexts. */
  uploadedImages: UploadedImage[];
  /** Uploaded images removed with the selected stable conversation context. */
  removedImages: UploadedImage[];
}
