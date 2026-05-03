import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteUploadedObject } from '../api/storage.api';
import { clearPendingFilesForConversation } from '../composables/attached-files.state';
import { useConversationStore } from './conversation';

vi.mock('../api/storage.api', () => ({
  deleteUploadedObject: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../composables/attached-files.state', async () => {
  const actual = await vi.importActual('../composables/attached-files.state');
  return {
    ...(actual as object),
    clearPendingFilesForConversation: vi.fn(),
  };
});

describe('useConversationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('deleteCurrentConversation removes exchanges and images tied to the current context', async () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation(
      'temporary',
      'evt',
      'room1',
    );
    const parentId = conversation.id;
    const conversationId = conversation.conversationId;

    store.addExchange(parentId, {
      role: 'user',
      content: 'hello',
      status: 'done',
      conversationId,
    });
    conversation.uploadedImages = [
      {
        name: 'a.png',
        hash: 'hash1',
        uploadedAt: 1,
        size: 100,
        selected: true,
        conversationId,
      },
    ];

    await store.deleteCurrentConversation(parentId);

    expect(clearPendingFilesForConversation).toHaveBeenCalledWith(
      parentId,
      conversationId,
    );
    expect(conversation.exchanges).toHaveLength(0);
    expect(conversation.uploadedImages).toHaveLength(0);
    expect(store.conversations).toHaveLength(0);
  });

  it('deleteCurrentConversation only deletes MinIO objects that are no longer referenced', async () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation(
      'temporary',
      'evt',
      'room1',
    );
    const parentId = conversation.id;
    const conversationId = conversation.conversationId;

    conversation.uploadedImages = [
      {
        name: 'shared.png',
        hash: 'hash-shared',
        uploadedAt: 1,
        size: 100,
        selected: true,
        conversationId,
      },
      {
        name: 'shared.png',
        hash: 'hash-shared',
        uploadedAt: 2,
        size: 100,
        selected: true,
        conversationId: 'other-context',
      },
      {
        name: 'unique.png',
        hash: 'hash-unique',
        uploadedAt: 3,
        size: 100,
        selected: true,
        conversationId,
      },
    ];

    await store.deleteCurrentConversation(parentId);

    expect(deleteUploadedObject).toHaveBeenCalledWith(
      parentId,
      conversationId,
      'hash-unique',
    );
    expect(deleteUploadedObject).not.toHaveBeenCalledWith(
      parentId,
      conversationId,
      'hash-shared',
    );
  });

  it('deleteCurrentConversation keeps the conversation when other contexts have exchanges', async () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation(
      'temporary',
      'evt',
      'room1',
    );
    const parentId = conversation.id;
    const conversationId = conversation.conversationId;

    store.addExchange(parentId, {
      role: 'user',
      content: 'new context',
      status: 'done',
      conversationId,
    });
    store.addExchange(parentId, {
      role: 'user',
      content: 'old context',
      status: 'done',
      conversationId: 'old-context',
    });

    await store.deleteCurrentConversation(parentId);

    expect(store.conversations).toHaveLength(1);
    expect(conversation.exchanges).toHaveLength(1);
    expect(conversation.exchanges[0]?.conversationId).toBe('old-context');
  });

  it('deleteCurrentConversation updates activeConversationId when deleting the active conversation', async () => {
    const store = useConversationStore();
    const first = store.createNewConversation('temporary');
    const second = store.createNewConversation('temporary');
    store.setActiveConversation(second.id);

    await store.deleteCurrentConversation(second.id);

    expect(store.activeConversationId).toBe(first.id);
  });

  it('deleteCurrentConversation falls back to null active id when no conversations remain', async () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation('temporary');
    store.setActiveConversation(conversation.id);

    await store.deleteCurrentConversation(conversation.id);

    expect(store.activeConversationId).toBeNull();
  });

  it('buildPrompt returns text-only messages for included exchanges', () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation('temporary');
    const conversationId = conversation.conversationId;

    store.addExchange(conversation.id, {
      role: 'user',
      content: '<p>Hello</p>',
      status: 'done',
      conversationId,
    });
    store.addExchange(conversation.id, {
      role: 'assistant',
      content: '<p>Hi <strong>there</strong></p>',
      status: 'done',
      conversationId,
      harnessTemplate: 'text',
      text: 'Hi there',
    });
    store.addExchange(conversation.id, {
      role: 'user',
      content: 'ignored',
      status: 'done',
      conversationId,
      included: false,
    });

    const prompt = store.buildPrompt(conversation.id);
    const messages = JSON.parse(prompt);

    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ role: 'user', content: 'Hello' });
    expect(messages[1]).toEqual({ role: 'assistant', content: 'Hi there' });
  });

  it('buildPrompt prefers text field and serializes harness data when text is absent', () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation('temporary');

    store.addExchange(conversation.id, {
      role: 'assistant',
      content: 'summary text',
      status: 'done',
      conversationId: conversation.conversationId,
      harnessTemplate: 'article',
      harnessData: { title: 'Title', sectionContent: 'Body' } as any,
      text: 'body text',
      model: 'llama3',
    });

    const messages = JSON.parse(store.buildPrompt(conversation.id));

    expect(messages).toEqual([{ role: 'assistant', content: 'body text' }]);

    const conversation2 = store.createNewConversation('temporary');
    store.addExchange(conversation2.id, {
      role: 'assistant',
      content: 'fallback',
      status: 'done',
      conversationId: conversation2.conversationId,
      harnessTemplate: 'article',
      harnessData: {
        category: 'Gaming',
        title: 'Neverness to Everness',
        sectionContent: 'An open-world RPG.',
      } as any,
      model: 'llama3',
    });

    const messages2 = JSON.parse(store.buildPrompt(conversation2.id));
    expect(messages2).toHaveLength(1);
    expect(messages2[0].role).toBe('assistant');
    expect(messages2[0].content).toContain('Title: Neverness to Everness');
    expect(messages2[0].content).toContain('An open-world RPG.');
  });

  it('buildPrompt returns an empty array for unknown conversation ids', () => {
    const store = useConversationStore();
    expect(store.buildPrompt('missing-id')).toBe('[]');
  });
});
