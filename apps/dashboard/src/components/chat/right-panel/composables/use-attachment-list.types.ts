import type { Ref } from 'vue';

import type { AttachedFileEntry } from '@/composables/attached-files.state.types';
import type { UploadedDocument, UploadedImage } from '@/stores/conversation';

export interface AttachmentPage {
  name: string;
  hash: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  hash: string;
  previewUrl: string;
  isUploaded: boolean;
  isSelected: boolean;
  pendingIndex: number | null;
  source?: 'local' | 'cloud';
  /** Original file size in bytes (documents and images). */
  size?: number;
  /** Image entries render a thumbnail; document entries render an icon tile;
   * gallery entries render a page-image grid for one pdf. */
  kind: 'image' | 'document' | 'gallery';
  /** Page images of a gallery entry (pdf), in page order. */
  pages?: AttachmentPage[];
}

export interface UseAttachmentListOptions {
  attachedFiles: Ref<AttachedFileEntry[]>;
  uploadedImages: Ref<UploadedImage[]>;
  uploadedDocuments: Ref<UploadedDocument[]>;
}
