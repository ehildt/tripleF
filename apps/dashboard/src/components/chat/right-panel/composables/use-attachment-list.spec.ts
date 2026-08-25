import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type { UploadedDocument, UploadedImage } from '@/stores/conversation';

import type { AttachedFileEntry } from '../../../../composables/attached-files.state';
import { useAttachmentList } from './use-attachment-list';

const file = new File([''], 'cat.png', { type: 'image/png' });

describe('useAttachmentList', () => {
  it('starts empty', () => {
    const { attachments, hasAttachments } = useAttachmentList({
      attachedFiles: ref([]),
      uploadedImages: ref([]),
      uploadedDocuments: ref([]),
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
        kind: 'image',
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
      uploadedDocuments: ref([]),
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
      kind: 'image',
    });
    expect(attachments.value[1]).toMatchObject({
      id: 'uploaded-h2',
      name: 'dog.png',
      hash: 'h2',
      isUploaded: true,
      isSelected: false,
      pendingIndex: null,
      kind: 'image',
    });
  });

  it('includes uploaded documents as document entries', () => {
    const uploadedDocuments = ref<UploadedDocument[]>([
      {
        name: 'notes.txt',
        hash: 'h3',
        extractedText: 'hello',
        uploadedAt: 0,
        selected: true,
        conversationId: 'c1',
      },
    ]);

    const { attachments } = useAttachmentList({
      attachedFiles: ref([]),
      uploadedImages: ref([]),
      uploadedDocuments,
    });

    expect(attachments.value).toHaveLength(1);
    expect(attachments.value[0]).toMatchObject({
      id: 'uploaded-document-h3',
      name: 'notes.txt',
      hash: 'h3',
      isUploaded: true,
      isSelected: true,
      pendingIndex: null,
      kind: 'document',
    });
  });
});
