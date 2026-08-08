import type { UploadedImage } from '../../../stores/conversation.model';

export interface ClassifiedSelectedFiles {
  newFiles: File[];
  referencedImages: UploadedImage[];
}
