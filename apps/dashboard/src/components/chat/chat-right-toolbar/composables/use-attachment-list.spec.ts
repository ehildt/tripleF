import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref } from 'vue';

import type { UploadedDocument, UploadedImage } from '@/stores/conversation';
import type { AttachedFileEntry } from '@/types/attached-files.model';

import { useAttachmentList } from './use-attachment-list';

const file = new File([''], 'cat.png', { type: 'image/png' });

/** Drives the mocked store reads that `useAttachmentList` composes. */
const state = vi.hoisted(() => ({})) as {
  attachedFiles: Ref<AttachedFileEntry[]>;
  uploadedImages: Ref<UploadedImage[]>;
  uploadedDocuments: Ref<UploadedDocument[]>;
};

vi.mock('@/stores/attached-files', async () => {
  const { ref } = await import('vue');
  const attachedFiles = ref<AttachedFileEntry[]>([]);
  state.attachedFiles = attachedFiles;
  return {
    useAttachedFilesStore: () => ({
      // The real store unwraps its `attachedFiles` computed to the array; a
      // getter mirrors that unwrapping so `useAttachmentList` reads the array.
      get attachedFiles() {
        return attachedFiles.value;
      },
    }),
  };
});

vi.mock('@/stores/conversation', async () => {
  const { ref } = await import('vue');
  const uploadedImages = ref<UploadedImage[]>([]);
  const uploadedDocuments = ref<UploadedDocument[]>([]);
  state.uploadedImages = uploadedImages;
  state.uploadedDocuments = uploadedDocuments;
  return {
    useConversationStore: () => ({
      activeConversationId: 'conv-1',
      getConversation: () => ({ id: 'conv-1', conversationId: 'c1' }),
      getConversationId: () => 'c1',
      getUploadedImagesForConversation: () => uploadedImages.value,
      getUploadedDocumentsForConversation: () => uploadedDocuments.value,
    }),
  };
});

describe('useAttachmentList', () => {
  beforeEach(() => {
    state.attachedFiles.value = [];
    state.uploadedImages.value = [];
    state.uploadedDocuments.value = [];
  });

  it('starts empty', () => {
    const { attachments, hasAttachments } = useAttachmentList();

    expect(attachments.value).toEqual([]);
    expect(hasAttachments.value).toBe(false);
  });

  it('merges pending files and uploaded images', () => {
    state.attachedFiles.value = [
      {
        file,
        isSelected: true,
        objectUrl: 'blob://cat',
        hash: 'h1',
        conversationId: 'c1',
        kind: 'image',
      },
    ];
    state.uploadedImages.value = [
      {
        name: 'dog.png',
        hash: 'h2',
        uploadedAt: 0,
        selected: false,
        conversationId: 'c1',
      },
    ];

    const { attachments, hasAttachments } = useAttachmentList();

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
    state.uploadedDocuments.value = [
      {
        name: 'notes.txt',
        hash: 'h3',
        extractedText: 'hello',
        uploadedAt: 0,
        selected: true,
        conversationId: 'c1',
      },
    ];

    const { attachments } = useAttachmentList();

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

  it('groups pdf page images into a gallery and hides the pdf original', () => {
    state.uploadedImages.value = [
      {
        name: 'doc.pdf · page 1',
        hash: 'p1',
        page: 1,
        parentHash: 'doc-hash',
        parentName: 'doc.pdf',
        uploadedAt: 0,
        selected: true,
        conversationId: 'c1',
      },
      {
        name: 'doc.pdf · page 2',
        hash: 'p2',
        page: 2,
        parentHash: 'doc-hash',
        parentName: 'doc.pdf',
        uploadedAt: 0,
        selected: true,
        conversationId: 'c1',
      },
    ];
    state.uploadedDocuments.value = [
      {
        name: 'doc.pdf',
        hash: 'doc-hash',
        type: 'application/pdf',
        uploadedAt: 0,
        selected: true,
        conversationId: 'c1',
      },
    ];

    const { attachments } = useAttachmentList();

    expect(attachments.value).toHaveLength(1);
    expect(attachments.value[0]).toMatchObject({
      id: 'gallery-doc-hash',
      name: 'doc.pdf',
      hash: 'doc-hash',
      isUploaded: true,
      isSelected: true,
      pendingIndex: null,
      kind: 'gallery',
    });
    expect(attachments.value[0].pages).toEqual([
      { name: 'doc.pdf · page 1', hash: 'p1' },
      { name: 'doc.pdf · page 2', hash: 'p2' },
    ]);
  });

  it('hides a pending pdf original when its pages are grouped', () => {
    state.attachedFiles.value = [
      {
        file: new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }),
        isSelected: true,
        objectUrl: '',
        hash: 'doc-hash',
        conversationId: 'c1',
        kind: 'document',
      },
    ];
    state.uploadedImages.value = [
      {
        name: 'doc.pdf · page 1',
        hash: 'p1',
        page: 1,
        parentHash: 'doc-hash',
        parentName: 'doc.pdf',
        uploadedAt: 0,
        selected: true,
        conversationId: 'c1',
      },
    ];

    const { attachments } = useAttachmentList();

    expect(attachments.value).toHaveLength(1);
    expect(attachments.value[0].kind).toBe('gallery');
  });

  it('interleaves standalone images and galleries in insertion order', () => {
    state.uploadedImages.value = [
      { name: 'cat.png', hash: 'img1', uploadedAt: 0, conversationId: 'c1' },
      {
        name: 'doc.pdf · page 1',
        hash: 'p1',
        page: 1,
        parentHash: 'doc-hash',
        parentName: 'doc.pdf',
        uploadedAt: 0,
        selected: true,
        conversationId: 'c1',
      },
      { name: 'dog.png', hash: 'img2', uploadedAt: 0, conversationId: 'c1' },
    ];

    const { attachments } = useAttachmentList();

    expect(attachments.value.map((a) => a.kind)).toEqual([
      'image',
      'gallery',
      'image',
    ]);
  });
});
