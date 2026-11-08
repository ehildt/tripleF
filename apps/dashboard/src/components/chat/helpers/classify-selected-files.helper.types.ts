import type { UploadedImage } from '../../../stores/chat/conversation/conversation.model';

export interface ClassifiedSelectedFiles {
  newFiles: File[];
  referencedImages: UploadedImage[];
}
