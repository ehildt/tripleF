import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { convertDocuments } from '@/api/documents.api';
import { checkObjectExists } from '@/api/object-storage.api';
import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { usePendingAttachments } from '@/components/chat/shared/composables/use-pending-attachments';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { getUploadedImagesForConversation } from '@/stores/chat/conversation/helpers/get-uploaded-images-for-conversation.helper';
import { hashFile } from '@/utils/hash-file/hash-file.helper';

import { useAttachmentIntake } from './use-attachment-intake';

vi.mock('@/utils/hash-file/hash-file.helper', () => ({ hashFile: vi.fn() }));
vi.mock('@/api/documents.api', () => ({ convertDocuments: vi.fn() }));
vi.mock('@/api/object-storage.api', () => ({
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

describe('useAttachmentIntake', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mockedHashFile.mockImplementation(async (file: File) => file.name);
    vi.mocked(
      (await import('@/api/conversations.api')).fetchConversations,
    ).mockResolvedValue([]);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  function setupConversation() {
    const conversationStore = useConversationStore();
    const conversation = useConversationCatalog().ensureConversation();
    useConversationCatalog().setActiveConversation(conversation.id);
    return { conversation, conversationStore };
  }

  it('adds files as pending uploads when they do not exist in storage', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await useAttachmentIntake().addFiles([file]);

    const entries = usePendingAttachments().attachedFiles.value;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: expect.any(String),
      hash: 'test.png',
      isSelected: true,
      kind: 'image',
      objectUrl: 'blob:mock-url',
    });
    expect(entries[0].file.name).toBe('test.png');
  });

  it('does not share pending files between stable conversation ids', async () => {
    const { conversationStore } = setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await useAttachmentIntake().addFiles([file]);

    conversationStore.setConversationId(
      conversationStore.activeConversationId!,
      'other-conversation',
    );

    expect(usePendingAttachments().attachedFiles.value).toEqual([]);
  });

  it('adds existing stored images as uploaded metadata', async () => {
    const { conversation } = setupConversation();
    mockedCheckObjectExists.mockResolvedValue(true);
    const file = new File(['hello'], 'cloud.png', { type: 'image/png' });

    await useAttachmentIntake().addFiles([file]);

    expect(usePendingAttachments().attachedFiles.value).toEqual([]);
    expect(getUploadedImagesForConversation(conversation)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'cloud.png',
          hash: 'cloud.png',
          selected: true,
        }),
      ]),
    );
  });

  it('adds text documents as pending entries without extraction', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const file = new File(['hello world'], 'notes.txt', {
      type: 'text/plain',
    });

    await useAttachmentIntake().addFiles([file]);

    expect(usePendingAttachments().attachedFiles.value[0]).toMatchObject({
      kind: 'document',
      hash: 'notes.txt',
      isSelected: true,
      objectUrl: '',
    });
  });

  it('converts pdf pages to images and keeps the original pending', async () => {
    const { conversation } = setupConversation();
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
    const file = new File(['%PDF-1.4'], 'report.pdf', {
      type: 'application/pdf',
    });

    await useAttachmentIntake().addFiles([file]);

    expect(mockedConvertDocuments).toHaveBeenCalledWith(
      conversation.id,
      conversation.conversationId ?? '',
      [{ file, hash: 'report.pdf' }],
    );
    expect(getUploadedImagesForConversation(conversation)).toEqual(
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
    expect(usePendingAttachments().attachedFiles.value[0]).toMatchObject({
      kind: 'document',
      hash: 'report.pdf',
      isSelected: true,
    });
  });

  it('skips unsupported file types', async () => {
    setupConversation();
    const file = new File(['x'], 'legacy.doc');

    await useAttachmentIntake().addFiles([file]);

    expect(usePendingAttachments().attachedFiles.value).toEqual([]);
  });

  it('deduplicates images by hash', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    const intake = useAttachmentIntake();

    await intake.addFiles([file]);
    await intake.addFiles([file]);

    expect(usePendingAttachments().attachedFiles.value).toHaveLength(1);
  });

  it('retains duplicate documents with independent stable ids', async () => {
    setupConversation();
    mockedCheckObjectExists.mockResolvedValue(false);
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    const intake = useAttachmentIntake();

    await intake.addFiles([file]);
    await intake.addFiles([file]);

    const entries = usePendingAttachments().attachedFiles.value;
    expect(entries).toHaveLength(2);
    expect(entries[0].id).not.toBe(entries[1].id);
  });

  it('treats files as pending when the storage check fails', async () => {
    setupConversation();
    mockedCheckObjectExists.mockRejectedValue(new Error('network error'));
    const file = new File(['hello'], 'test.png', { type: 'image/png' });

    await useAttachmentIntake().addFiles([file]);

    expect(usePendingAttachments().attachedFiles.value).toHaveLength(1);
  });
});
