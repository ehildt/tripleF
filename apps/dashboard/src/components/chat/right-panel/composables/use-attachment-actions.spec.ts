import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { deleteUploadedObject } from '@/api/storage.api';
import type { AttachedFileEntry } from '@/composables/attached-files.state.types';
import type { Conversation } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

import { useAttachmentActions } from './use-attachment-actions';
import type { AttachmentItem } from './use-attachment-list.types';

vi.mock('@/api/storage.api', () => ({
  deleteUploadedObject: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

const mockedDeleteUploadedObject = vi.mocked(deleteUploadedObject);

function pageImage(
  hash: string,
  page: number,
  parentHash: string,
  cid: string,
) {
  return {
    name: `doc.pdf · page ${page}`,
    hash,
    page,
    parentHash,
    parentName: 'doc.pdf',
    uploadedAt: 0,
    selected: true,
    conversationId: cid,
  };
}

function galleryItem(): AttachmentItem {
  return {
    id: 'gallery-doc-hash',
    name: 'doc.pdf',
    hash: 'doc-hash',
    previewUrl: '',
    isUploaded: true,
    isSelected: true,
    pendingIndex: null,
    source: 'local',
    kind: 'gallery',
    pages: [
      { name: 'doc.pdf · page 1', hash: 'p1' },
      { name: 'doc.pdf · page 2', hash: 'p2' },
    ],
  };
}

describe('useAttachmentActions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  function setup(options: { pendingPdf?: boolean; uploadedPdf?: boolean }) {
    const store = useConversationStore();
    const conversation = store.createNewConversation('temporary', 'evt');
    const cid = store.getConversationId(conversation.id);
    store.setUploadedImages(conversation.id, [
      pageImage('p1', 1, 'doc-hash', cid),
      pageImage('p2', 2, 'doc-hash', cid),
    ]);
    if (options.uploadedPdf) {
      store.setUploadedDocuments(conversation.id, [
        {
          name: 'doc.pdf',
          hash: 'doc-hash',
          type: 'application/pdf',
          uploadedAt: 0,
          selected: true,
          conversationId: cid,
        },
      ]);
    }
    const attachedFiles = ref<AttachedFileEntry[]>(
      options.pendingPdf
        ? [
            {
              file: new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }),
              isSelected: true,
              objectUrl: '',
              hash: 'doc-hash',
              conversationId: cid,
              kind: 'document',
            },
          ]
        : [],
    );
    const attachments = ref<AttachmentItem[]>([galleryItem()]);
    const conversationRef = ref<Conversation | null>(conversation);
    const activeConversationId = ref(cid);
    const removePendingFile = vi.fn();
    const togglePendingFile = vi.fn();
    const actions = useAttachmentActions({
      attachments,
      attachedFiles,
      conversation: conversationRef,
      activeConversationId,
      removePendingFile,
      togglePendingFile,
    });
    return {
      store,
      conversation,
      cid,
      actions,
      removePendingFile,
      togglePendingFile,
    };
  }

  it('removes a whole gallery: pages, objects, and the pending original', async () => {
    const { store, conversation, cid, actions, removePendingFile } = setup({
      pendingPdf: true,
    });

    await actions.removeAttachment('gallery-doc-hash');

    expect(mockedDeleteUploadedObject).toHaveBeenCalledTimes(2);
    expect(
      store.getUploadedImagesForConversation(conversation.id, cid),
    ).toEqual([]);
    expect(removePendingFile).toHaveBeenCalledWith(0);
  });

  it('removes the uploaded document when the whole gallery is dropped post-submit', async () => {
    const { store, conversation, cid, actions } = setup({ uploadedPdf: true });

    await actions.removeAttachment('gallery-doc-hash');

    expect(
      store.getUploadedDocumentsForConversation(conversation.id, cid),
    ).toEqual([]);
  });

  it('drops a single page and keeps the gallery and the original', async () => {
    const { store, conversation, cid, actions, removePendingFile } = setup({
      pendingPdf: true,
    });

    await actions.removePage('doc-hash', 'p1');

    expect(
      store
        .getUploadedImagesForConversation(conversation.id, cid)
        .map((i) => i.hash),
    ).toEqual(['p2']);
    expect(removePendingFile).not.toHaveBeenCalled();
  });

  it('drops the last page and removes the whole pdf', async () => {
    const { store, conversation, cid, actions, removePendingFile } = setup({
      pendingPdf: true,
    });

    await actions.removePage('doc-hash', 'p1');
    await actions.removePage('doc-hash', 'p2');

    expect(
      store.getUploadedImagesForConversation(conversation.id, cid),
    ).toEqual([]);
    expect(removePendingFile).toHaveBeenCalledWith(0);
  });

  it('toggles a gallery: flips every page and the original together', () => {
    const { store, conversation, cid, actions, togglePendingFile } = setup({
      pendingPdf: true,
    });

    actions.toggleAttachment('gallery-doc-hash');

    const images = store.getUploadedImagesForConversation(conversation.id, cid);
    expect(images.every((i) => i.selected === false)).toBe(true);
    expect(togglePendingFile).toHaveBeenCalledWith(0);
  });

  it('removes an image card: deletes the object and removes the image', async () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation('temporary', 'evt');
    const cid = store.getConversationId(conversation.id);
    store.setUploadedImages(conversation.id, [
      {
        name: 'cat.png',
        hash: 'img1',
        uploadedAt: 0,
        selected: true,
        conversationId: cid,
      },
    ]);
    const attachments = ref<AttachmentItem[]>([
      {
        id: 'uploaded-img1',
        name: 'cat.png',
        hash: 'img1',
        previewUrl: '',
        isUploaded: true,
        isSelected: true,
        pendingIndex: null,
        source: 'local',
        kind: 'image',
      },
    ]);
    const actions = useAttachmentActions({
      attachments,
      attachedFiles: ref([]),
      conversation: ref(conversation),
      activeConversationId: ref(cid),
      removePendingFile: vi.fn(),
      togglePendingFile: vi.fn(),
    });

    await actions.removeAttachment('uploaded-img1');

    expect(mockedDeleteUploadedObject).toHaveBeenCalledWith(
      conversation.id,
      cid,
      'img1',
    );
    expect(
      store.getUploadedImagesForConversation(conversation.id, cid),
    ).toEqual([]);
  });

  it('removes a document row without touching storage', async () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation('temporary', 'evt');
    const cid = store.getConversationId(conversation.id);
    store.setUploadedDocuments(conversation.id, [
      {
        name: 'notes.txt',
        hash: 'h3',
        type: 'text/plain',
        uploadedAt: 0,
        selected: true,
        conversationId: cid,
      },
    ]);
    const attachments = ref<AttachmentItem[]>([
      {
        id: 'uploaded-document-h3',
        name: 'notes.txt',
        hash: 'h3',
        previewUrl: '',
        isUploaded: true,
        isSelected: true,
        pendingIndex: null,
        source: 'local',
        kind: 'document',
      },
    ]);
    const actions = useAttachmentActions({
      attachments,
      attachedFiles: ref([]),
      conversation: ref(conversation),
      activeConversationId: ref(cid),
      removePendingFile: vi.fn(),
      togglePendingFile: vi.fn(),
    });

    await actions.removeAttachment('uploaded-document-h3');

    expect(mockedDeleteUploadedObject).not.toHaveBeenCalled();
    expect(
      store.getUploadedDocumentsForConversation(conversation.id, cid),
    ).toEqual([]);
  });
});
