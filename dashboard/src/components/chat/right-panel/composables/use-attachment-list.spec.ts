import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type { UploadedImage } from '@/stores/conversation';

import type { AttachedFileEntry } from '../../../../composables/attached-files.state';
import { useAttachmentList } from './use-attachment-list';

const file = new File([''], 'cat.png', { type: 'image/png' });

describe('useAttachmentList', () => {
  it('starts empty', () => {
    const { attachments, hasAttachments } = useAttachmentList({
      attachedFiles: ref([]),
      uploadedImages: ref([]),
    });

    expect(attachments.value).toEqual([]);
    expect(hasAttachments.value).toBe(false);
  });

  it('merges pending files and uploaded images', () => {
    const attachedFiles = ref<AttachedFileEntry[]>([
      {
        file,
        isSelected: true,
        objectUrl: 'blob://cat',
        hash: 'h1',
        conversationId: 'c1',
      },
    ]);
    const uploadedImages = ref<UploadedImage[]>([
      {
        name: 'dog.png',
        hash: 'h2',
        uploadedAt: 0,
        selected: false,
        conversationId: 'c1',
      },
    ]);

    const { attachments, hasAttachments } = useAttachmentList({
      attachedFiles,
      uploadedImages,
    });

    expect(hasAttachments.value).toBe(true);
    expect(attachments.value).toHaveLength(2);
    expect(attachments.value[0]).toMatchObject({
      id: 'pending-h1-0',
      name: 'cat.png',
      hash: 'h1',
      previewUrl: 'blob://cat',
      isUploaded: false,
      isSelected: true,
      pendingIndex: 0,
    });
    expect(attachments.value[1]).toMatchObject({
      id: 'uploaded-h2',
      name: 'dog.png',
      hash: 'h2',
      isUploaded: true,
      isSelected: false,
      pendingIndex: null,
    });
  });
});
