import type { Ref } from 'vue';

import type { AttachedFileEntry } from '@/composables/attached-files.state.types';
import type { UploadedDocument, UploadedImage } from '@/stores/conversation';

export interface AttachmentItem {
  id: string;
  name: string;
  hash: string;
  previewUrl: string;
  isUploaded: boolean;
  isSelected: boolean;
  pendingIndex: number | null;
  source?: 'local' | 'cloud';
  /** Image entries render a thumbnail; document entries render an icon tile. */
  kind: 'image' | 'document';
}

export interface UseAttachmentListOptions {
  attachedFiles: Ref<AttachedFileEntry[]>;
  uploadedImages: Ref<UploadedImage[]>;
  uploadedDocuments: Ref<UploadedDocument[]>;
}
