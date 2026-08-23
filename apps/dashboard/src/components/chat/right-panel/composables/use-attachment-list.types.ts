import type { Ref } from 'vue';

import type { AttachedFileEntry } from '@/composables/attached-files.state.types';
import type { UploadedImage } from '@/stores/conversation';

export interface AttachmentItem {
  id: string;
  name: string;
  hash: string;
  previewUrl: string;
  isUploaded: boolean;
  isSelected: boolean;
  pendingIndex: number | null;
  source?: 'local' | 'cloud';
}

export interface UseAttachmentListOptions {
  attachedFiles: Ref<AttachedFileEntry[]>;
  uploadedImages: Ref<UploadedImage[]>;
}
