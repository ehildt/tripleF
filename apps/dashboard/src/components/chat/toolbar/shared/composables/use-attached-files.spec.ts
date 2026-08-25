import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';

import { pendingFilesByConversation } from '../../../../../composables/attached-files.state';
import { useAttachedFiles } from './use-attached-files';

vi.mock('../../../../../utils/hash-file.helper', () => ({
  hashFile: vi.fn(),
}));

vi.mock('../../../../../api/documents.api', () => ({
  convertDocuments: vi.fn(),
}));

vi.mock('../../../../../api/storage.api', () => ({
  checkObjectExists: vi.fn(),
  deleteUploadedObject: vi.fn(),
}));

vi.mock('../../../../../api/conversations.api', () => ({
  fetchConversations: vi.fn(),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

vi.mock('../../../../../api/conversations.api', () => ({
  fetchConversations: vi.fn(),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

import { fetchConversations } from '../../../../../api/conversations.api';
import { convertDocuments } from '../../../../../api/documents.api';
import { checkObjectExists } from '../../../../../api/storage.api';
import { hashFile } from '../../../../../utils/hash-file.helper';

const mockedHashFile = vi.mocked(hashFile);
const mockedCheckObjectExists = vi.mocked(checkObjectExists);
const mockedFetchConversations = vi.mocked(fetchConversations);
const mockedConvertDocuments = vi.mocked(convertDocuments);

describe('useAttachedFiles', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mockedHashFile.mockImplementation(async (file: File) => file.name);
    mockedFetchConversations.mockResolvedValue([]);

    setActivePinia(createPinia());
    // The conversation store loads persisted conversations asynchronously on
    // creation — let that settle before tests create conversations, or the
    // load result would wipe them mid-test.
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));

    pendingFilesByConversation.value = new Map();
  });

  function createInput(files: File[]): HTMLInputElement {
    return { files, value: '' } as unknown as HTMLInputElement;
  }

  function createEvent(files: File[]): Event {
    return { target: createInput(files) } as unknown as Event;
  }

  function setupSession() {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    return { conversation, conversationStore };
  }

  it('starts with no attached files', () => {
    const { attachedFiles, selectedFiles } = useAttachedFiles();
    expect(attachedFiles.value).toEqual([]);
    expect(selectedFiles.value).toEqual([]);
  });

  it('exposes a file input ref', () => {
    const { fileInputRef } = useAttachedFiles();
    expect(fileInputRef.value).toBeNull();
  });

  it('adds files as pending uploads when they do not exist in MinIO', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value).toHaveLength(1);
    expect(attachedFiles.value[0].file.name).toBe('test.png');
    expect(attachedFiles.value[0].isSelected).toBe(true);
    expect(attachedFiles.value[0].hash).toBe('test.png');
  });

  it('keeps pending files alive across multiple composable instances for the same conversation', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const first = useAttachedFiles();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await first.onFileInputChange(createEvent([file]));
    expect(first.attachedFiles.value).toHaveLength(1);

    const second = useAttachedFiles();
    expect(second.attachedFiles.value).toHaveLength(1);
    expect(second.attachedFiles.value[0].file.name).toBe('test.png');
  });

  it('does not share pending files between conversations', async () => {
    const { conversationStore } = setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const first = useAttachedFiles();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await first.onFileInputChange(createEvent([file]));

    conversationStore.setConversationId(
      conversationStore.activeConversationId!,
      'other-conversation',
    );

    const second = useAttachedFiles();
    expect(second.attachedFiles.value).toHaveLength(0);
    expect(first.attachedFiles.value).toHaveLength(0);
  });

  it('adds existing MinIO files as uploaded metadata instead of pending uploads', async () => {
    const { conversation, conversationStore } = setupSession();
    mockedCheckObjectExists.mockResolvedValue(true);
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['hello'], 'cloud.png', { type: 'image/png' });

    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value).toHaveLength(0);
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
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['hello world'], 'notes.txt', {
      type: 'text/plain',
    });

    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value).toHaveLength(1);
    expect(attachedFiles.value[0]).toMatchObject({
      kind: 'document',
      hash: 'notes.txt',
      isSelected: true,
    });
    expect(
      (attachedFiles.value[0] as { extractedText?: string }).extractedText,
    ).toBeUndefined();
  });

  it('converts pdf on the server at select: pages become images, original stays pending', async () => {
    const { conversation, conversationStore } = setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    mockedConvertDocuments.mockResolvedValue([
      {
        name: 'report.pdf',
        hash: 'report.pdf',
        type: 'application/pdf',
        kind: 'pdf',
        pageImages: [
          { name: 'report.pdf · page 1', hash: 'page-1-hash' },
          { name: 'report.pdf · page 2', hash: 'page-2-hash' },
        ],
      },
    ]);
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['%PDF-1.4'], 'report.pdf', {
      type: 'application/pdf',
    });

    await onFileInputChange(createEvent([file]));

    expect(mockedConvertDocuments).toHaveBeenCalledWith(
      conversation.id,
      conversation.conversationId ?? '',
      [{ file, hash: 'report.pdf' }],
    );
    // Pages land as conversation images (bubble tiles + files + lightbox).
    expect(
      conversationStore.getUploadedImagesForConversation(conversation.id),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'report.pdf · page 1',
          hash: 'page-1-hash',
          selected: true,
        }),
        expect.objectContaining({ hash: 'page-2-hash' }),
      ]),
    );
    // The original stays attached so it rides the submit's originals.
    expect(attachedFiles.value).toHaveLength(1);
    expect(attachedFiles.value[0]).toMatchObject({
      kind: 'document',
      hash: 'report.pdf',
      isSelected: true,
    });
  });

  it('toasts and skips unsupported file types', async () => {
    setupSession();
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['x'], 'legacy.doc');

    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value).toHaveLength(0);
  });

  it('does not add duplicate files for the same conversation', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await onFileInputChange(createEvent([file]));
    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value).toHaveLength(1);
  });

  it('treats files as pending when the MinIO check fails', async () => {
    setupSession();
    mockedCheckObjectExists.mockRejectedValue(new Error('network error'));
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value).toHaveLength(1);
  });

  it('removes a file by index and revokes object URL', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const { attachedFiles, onFileInputChange, removeAttachedFile } =
      useAttachedFiles();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await onFileInputChange(createEvent([file]));
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    removeAttachedFile(0);

    expect(attachedFiles.value).toHaveLength(0);
    expect(revokeSpy).toHaveBeenCalled();
  });

  it('toggles file selection', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const {
      attachedFiles,
      onFileInputChange,
      toggleAttachedFile,
      selectedFiles,
    } = useAttachedFiles();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await onFileInputChange(createEvent([file]));

    expect(selectedFiles.value).toHaveLength(1);
    toggleAttachedFile(0);
    expect(attachedFiles.value[0].isSelected).toBe(false);
    expect(selectedFiles.value).toHaveLength(0);
    toggleAttachedFile(0);
    expect(attachedFiles.value[0].isSelected).toBe(true);
    expect(selectedFiles.value).toHaveLength(1);
  });

  it('revokes all object URLs', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const { onFileInputChange, revokeAllObjectUrls } = useAttachedFiles();
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await onFileInputChange(createEvent([file]));
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    revokeAllObjectUrls();

    expect(revokeSpy).toHaveBeenCalled();
  });
});
