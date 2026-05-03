import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';

import { useAttachedFiles } from './use-attached-files';

vi.mock('../../../../../utils/hash-file.helper', () => ({
  hashFile: vi.fn(),
}));

vi.mock('../../../../../api/storage.api', () => ({
  checkObjectExists: vi.fn(),
}));

import { checkObjectExists } from '../../../../../api/storage.api';
import { hashFile } from '../../../../../utils/hash-file.helper';

const mockedHashFile = vi.mocked(hashFile);
const mockedCheckObjectExists = vi.mocked(checkObjectExists);

describe('useAttachedFiles', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    mockedHashFile.mockImplementation(async (file: File) => file.name);
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
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value.length).toBe(1);
    expect(attachedFiles.value[0].file.name).toBe('test.txt');
    expect(attachedFiles.value[0].isSelected).toBe(true);
    expect(attachedFiles.value[0].hash).toBe('test.txt');
  });

  it('keeps pending files alive across multiple composable instances for the same conversation', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const first = useAttachedFiles();
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

    await first.onFileInputChange(createEvent([file]));
    expect(first.attachedFiles.value.length).toBe(1);

    const second = useAttachedFiles();
    expect(second.attachedFiles.value.length).toBe(1);
    expect(second.attachedFiles.value[0].file.name).toBe('test.txt');
  });

  it('does not share pending files between conversations', async () => {
    const { conversationStore } = setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const first = useAttachedFiles();
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await first.onFileInputChange(createEvent([file]));

    conversationStore.setConversationId(
      conversationStore.activeConversationId!,
      'other-conversation',
    );

    const second = useAttachedFiles();
    expect(second.attachedFiles.value.length).toBe(0);
    expect(first.attachedFiles.value.length).toBe(0);
  });

  it('adds existing MinIO files as uploaded metadata instead of pending uploads', async () => {
    const { conversation, conversationStore } = setupSession();
    mockedCheckObjectExists.mockResolvedValue(true);
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['hello'], 'cloud.txt', { type: 'text/plain' });

    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value.length).toBe(0);
    expect(
      conversationStore.getUploadedImagesForConversation(conversation.id),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cloud.txt',
          hash: 'cloud.txt',
          selected: true,
        }),
      ]),
    );
  });

  it('does not add duplicate files for the same conversation', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

    await onFileInputChange(createEvent([file]));
    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value.length).toBe(1);
  });

  it('treats files as pending when the MinIO check fails', async () => {
    setupSession();
    mockedCheckObjectExists.mockRejectedValue(new Error('network error'));
    const { attachedFiles, onFileInputChange } = useAttachedFiles();
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

    await onFileInputChange(createEvent([file]));

    expect(attachedFiles.value.length).toBe(1);
  });

  it('removes a file by index and revokes object URL', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const { attachedFiles, onFileInputChange, removeAttachedFile } =
      useAttachedFiles();
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await onFileInputChange(createEvent([file]));
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    removeAttachedFile(0);

    expect(attachedFiles.value.length).toBe(0);
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
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await onFileInputChange(createEvent([file]));

    expect(selectedFiles.value.length).toBe(1);
    toggleAttachedFile(0);
    expect(attachedFiles.value[0].isSelected).toBe(false);
    expect(selectedFiles.value.length).toBe(0);
    toggleAttachedFile(0);
    expect(attachedFiles.value[0].isSelected).toBe(true);
    expect(selectedFiles.value.length).toBe(1);
  });

  it('revokes all object URLs', async () => {
    setupSession();
    mockedCheckObjectExists.mockResolvedValue(false);
    const { onFileInputChange, revokeAllObjectUrls } = useAttachedFiles();
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await onFileInputChange(createEvent([file]));
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    revokeAllObjectUrls();

    expect(revokeSpy).toHaveBeenCalled();
  });
});
