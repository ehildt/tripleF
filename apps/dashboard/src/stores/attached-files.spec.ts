import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { convertDocuments } from '@/api/documents.api';
import { checkObjectExists } from '@/api/storage.api';
import { useConversationStore } from '@/stores/conversation';
import { hashFile } from '@/utils/hash-file.helper';

import { useAttachedFilesStore } from './attached-files';

vi.mock('@/utils/hash-file.helper', () => ({
  hashFile: vi.fn(),
}));

vi.mock('@/api/documents.api', () => ({
  convertDocuments: vi.fn(),
}));

vi.mock('@/api/storage.api', () => ({
  checkObjectExists: vi.fn(),
  deleteUploadedObject: vi.fn(),
}));

vi.mock('@/api/conversations.api', () => ({
  fetchConversations: vi.fn(),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

const mockedHashFile = vi.mocked(hashFile);
const mockedCheckObjectExists = vi.mocked(checkObjectExists);
const mockedConvertDocuments = vi.mocked(convertDocuments);

describe('useAttachedFilesStore', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mockedHashFile.mockImplementation(async (file: File) => file.name);
    vi.mocked(
      (await import('@/api/conversations.api')).fetchConversations,
    ).mockResolvedValue([]);

    // jsdom's URL.createObjectURL reads browser-internal Blob buffers; the
    // tests only need an opaque url string, so mock it (and its revoke pair).
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    setActivePinia(createPinia());
    // The conversation store loads persisted conversations asynchronously on
    // creation — let that settle before tests create conversations, or the
    // load result would wipe them mid-test.
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));

    useAttachedFilesStore().pendingFilesByConversation = new Map();
  });

  function setupConversation() {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    return { conversation, conversationStore };
  }

  it('starts with no attached files', () => {
    const store = useAttachedFilesStore();
    expect(store.attachedFiles).toEqual([]);
    expect(store.selectedFiles).toEqual([]);
  });

  it('adds files as pending uploads when they do not exist in MinIO', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const store = useAttachedFilesStore();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await store.addFiles([file]);

    expect(store.attachedFiles).toHaveLength(1);
    expect(store.attachedFiles[0].file.name).toBe('test.png');
    expect(store.attachedFiles[0].isSelected).toBe(true);
    expect(store.attachedFiles[0].hash).toBe('test.png');
  });

  it('keeps pending files alive for the same conversation', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const store = useAttachedFilesStore();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await store.addFiles([file]);
    expect(store.attachedFiles).toHaveLength(1);

    expect(store.attachedFiles[0].file.name).toBe('test.png');
  });

  it('does not share pending files between conversations', async () => {
    const { conversationStore } = setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const store = useAttachedFilesStore();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await store.addFiles([file]);

    conversationStore.setConversationId(
      conversationStore.activeConversationId!,
      'other-conversation',
    );

    expect(store.attachedFiles).toHaveLength(0);
  });

  it('adds existing MinIO files as uploaded metadata instead of pending uploads', async () => {
    const { conversation, conversationStore } = setupConversation();
    mockedCheckObjectExists.mockResolvedValue(true);
    const store = useAttachedFilesStore();
    const file = new File(['hello'], 'cloud.png', { type: 'image/png' });

    await store.addFiles([file]);

    expect(store.attachedFiles).toHaveLength(0);
    expect(
      conversationStore.getUploadedImagesForConversation(conversation.id),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cloud.png',
          hash: 'cloud.png',
          selected: true,
        }),
      ]),
    );
  });

  it('adds text documents as pending document entries without extraction', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const store = useAttachedFilesStore();
    const file = new File(['hello world'], 'notes.txt', {
      type: 'text/plain',
    });

    await store.addFiles([file]);

    expect(store.attachedFiles).toHaveLength(1);
    expect(store.attachedFiles[0]).toMatchObject({
      kind: 'document',
      hash: 'notes.txt',
      isSelected: true,
    });
    expect(
      (store.attachedFiles[0] as { extractedText?: string }).extractedText,
    ).toBeUndefined();
  });

  it('converts pdf on the server at select: pages become images, original stays pending', async () => {
    const { conversation, conversationStore } = setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    mockedConvertDocuments.mockResolvedValue([
      {
        name: 'report.pdf',
        hash: 'report.pdf',
        type: 'application/pdf',
        kind: 'pdf',
        pageImages: [
          { name: 'report.pdf · page 1', hash: 'page-1-hash', page: 1 },
          { name: 'report.pdf · page 2', hash: 'page-2-hash', page: 2 },
        ],
      },
    ]);
    const store = useAttachedFilesStore();
    const file = new File(['%PDF-1.4'], 'report.pdf', {
      type: 'application/pdf',
    });

    await store.addFiles([file]);

    expect(mockedConvertDocuments).toHaveBeenCalledWith(
      conversation.id,
      conversation.conversationId ?? '',
      [{ file, hash: 'report.pdf' }],
    );
    // Pages land as conversation images (bubble tiles + files + lightbox),
    // carrying their parent pdf provenance for gallery grouping.
    expect(
      conversationStore.getUploadedImagesForConversation(conversation.id),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'report.pdf · page 1',
          hash: 'page-1-hash',
          page: 1,
          parentHash: 'report.pdf',
          parentName: 'report.pdf',
          selected: true,
        }),
        expect.objectContaining({ hash: 'page-2-hash', page: 2 }),
      ]),
    );
    // The original stays attached so it rides the submit's originals.
    expect(store.attachedFiles).toHaveLength(1);
    expect(store.attachedFiles[0]).toMatchObject({
      kind: 'document',
      hash: 'report.pdf',
      isSelected: true,
    });
  });

  it('toasts and skips unsupported file types', async () => {
    setupConversation();
    const store = useAttachedFilesStore();
    const file = new File(['x'], 'legacy.doc');

    await store.addFiles([file]);

    expect(store.attachedFiles).toHaveLength(0);
  });

  it('does not add duplicate files for the same conversation', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const store = useAttachedFilesStore();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await store.addFiles([file]);
    await store.addFiles([file]);

    expect(store.attachedFiles).toHaveLength(1);
  });

  it('treats files as pending when the MinIO check fails', async () => {
    setupConversation();
    mockedCheckObjectExists.mockRejectedValue(new Error('network error'));
    const store = useAttachedFilesStore();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await store.addFiles([file]);

    expect(store.attachedFiles).toHaveLength(1);
  });

  it('removes a file by index and revokes object URL', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const store = useAttachedFilesStore();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await store.addFiles([file]);
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    store.removeAttachedFile(0);

    expect(store.attachedFiles).toHaveLength(0);
    expect(revokeSpy).toHaveBeenCalled();
  });

  it('toggles file selection', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const store = useAttachedFilesStore();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await store.addFiles([file]);

    expect(store.selectedFiles).toHaveLength(1);
    store.toggleAttachedFile(0);
    expect(store.attachedFiles[0].isSelected).toBe(false);
    expect(store.selectedFiles).toHaveLength(0);
    store.toggleAttachedFile(0);
    expect(store.attachedFiles[0].isSelected).toBe(true);
    expect(store.selectedFiles).toHaveLength(1);
  });

  it('revokes all object URLs', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const store = useAttachedFilesStore();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await store.addFiles([file]);
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    store.revokeAllObjectUrls();

    expect(revokeSpy).toHaveBeenCalled();
  });
});
