import { computed, type Ref } from 'vue';

import type { UploadedImage } from '@/stores/conversation';

import type { AttachedFileEntry } from '../../../../composables/attached-files.state';

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

/**
 * Normalizes pending attached files and uploaded image metadata into a
 * single list for the merged Files panel.
 */
export function useAttachmentList(options: UseAttachmentListOptions) {
  const { attachedFiles, uploadedImages } = options;

  const attachments = computed<AttachmentItem[]>(() => {
    const pending: AttachmentItem[] = attachedFiles.value.map(
      (entry, index) => ({
        id: `pending-${entry.hash}-${index}`,
        name: entry.file.name,
        hash: entry.hash,
        previewUrl: entry.objectUrl,
        isUploaded: false,
        isSelected: entry.isSelected,
        pendingIndex: index,
        source: 'local',
      }),
    );

    const uploaded: AttachmentItem[] = uploadedImages.value.map((image) => ({
      id: `uploaded-${image.hash}`,
      name: image.name,
      hash: image.hash,
      previewUrl: '',
      isUploaded: true,
      isSelected: image.selected !== false,
      pendingIndex: null,
      source: image.source ?? 'local',
    }));

    return [...pending, ...uploaded];
  });

  const hasAttachments = computed(() => attachments.value.length > 0);

  return {
    attachments,
    hasAttachments,
  };
}
