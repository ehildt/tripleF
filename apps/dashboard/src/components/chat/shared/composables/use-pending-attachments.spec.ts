import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAttachedFilesStore } from '@/stores/chat/attached-files/attached-files.store';
import type { PendingAttachmentScope } from '@/stores/chat/attached-files/attached-files.store.types';
import { useConversationStore } from '@/stores/conversation/conversation.store';

import { usePendingAttachments } from './use-pending-attachments';

vi.mock('@/api/conversations.api', () => ({
  fetchConversations: vi.fn(),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

function image(name: string): File {
  return new File(['image'], name, { type: 'image/png' });
}

describe('usePendingAttachments', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.mocked(
      (await import('@/api/conversations.api')).fetchConversations,
    ).mockResolvedValue([]);
    let nextUrl = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(
      () => `blob:mock-${++nextUrl}`,
    );
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  function setupConversation(): PendingAttachmentScope {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    return {
      parentConversationId: conversation.id,
      conversationId: conversation.conversationId,
    };
  }

  it('returns empty active values without a conversation', () => {
    const pending = usePendingAttachments();

    expect(pending.attachedFiles.value).toEqual([]);
    expect(pending.selectedFiles.value).toEqual([]);
  });

  it('creates preview URLs only for images', () => {
    const scope = setupConversation();
    const pending = usePendingAttachments();

    pending.addPendingFile(scope, image('one.png'), 'image-hash', 'image');
    pending.addPendingFile(
      scope,
      new File(['text'], 'notes.txt', { type: 'text/plain' }),
      'document-hash',
      'document',
    );

    expect(pending.attachedFiles.value).toHaveLength(2);
    expect(pending.attachedFiles.value[0].objectUrl).toBe('blob:mock-1');
    expect(pending.attachedFiles.value[1].objectUrl).toBe('');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('derives selected files and toggles an entry by stable id', () => {
    const scope = setupConversation();
    const pending = usePendingAttachments();
    pending.addPendingFile(scope, image('one.png'), 'hash', 'image');
    const entry = pending.attachedFiles.value[0];

    expect(pending.selectedFiles.value).toEqual([entry.file]);
    pending.togglePendingFile(entry.id);
    expect(pending.selectedFiles.value).toEqual([]);
    expect(pending.attachedFiles.value[0].isSelected).toBe(false);
  });

  it('keeps entries scoped when the active stable id changes', () => {
    const scope = setupConversation();
    const conversationStore = useConversationStore();
    const pending = usePendingAttachments();
    pending.addPendingFile(scope, image('one.png'), 'hash', 'image');

    conversationStore.setConversationId(scope.parentConversationId, 'other');
    expect(pending.attachedFiles.value).toEqual([]);
    conversationStore.setConversationId(
      scope.parentConversationId,
      scope.conversationId,
    );
    expect(pending.attachedFiles.value).toHaveLength(1);
  });

  it('removes and revokes only the requested duplicate-hash entry', () => {
    const scope = setupConversation();
    const pending = usePendingAttachments();
    pending.addPendingFile(scope, image('one.png'), 'same', 'image');
    pending.addPendingFile(scope, image('two.png'), 'same', 'image');
    const [first, second] = pending.attachedFiles.value;

    pending.removePendingFile(first.id);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first.objectUrl);
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(second.objectUrl);
    expect(pending.attachedFiles.value.map((entry) => entry.id)).toEqual([
      second.id,
    ]);
  });

  it('clears and revokes one explicit pair while preserving another', () => {
    const scope = setupConversation();
    const otherScope = {
      parentConversationId: 'other-parent',
      conversationId: 'other-stable',
    };
    const pending = usePendingAttachments();
    pending.addPendingFile(scope, image('one.png'), 'one', 'image');
    pending.addPendingFile(otherScope, image('two.png'), 'two', 'image');

    pending.clearPendingFiles(scope);

    expect(pending.attachedFiles.value).toEqual([]);
    expect(useAttachedFilesStore().pendingFilesFor(otherScope)).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-1');
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:mock-2');
  });
});
