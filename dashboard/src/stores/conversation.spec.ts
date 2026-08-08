import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteConversation,
  fetchConversation,
  fetchConversations,
  saveConversation,
} from '../api/conversations.api';
import { deleteUploadedObject } from '../api/storage.api';
import { clearPendingFilesForConversation } from '../composables/attached-files.state';
import { useAppStore } from './app';
import { useConversationStore } from './conversation';

vi.mock('../api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

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
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    // The conversation store hydrates persisted conversations asynchronously
    // on creation — settle before seeding, or the load result would wipe
    // conversations seeded mid-test.
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
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

    expect(messages).toEqual([
      { role: 'assistant', content: '[Template: article]\nbody text' },
    ]);

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

  it('hydrates conversations lazily as stubs from the list endpoint', async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce([
      {
        id: 'local-1',
        conversationId: 'conv-1',
        title: 'Hello',
        type: 'persistent',
        contextUsagePercent: '25.00',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const store = useConversationStore();
    const stub = store.getConversation('local-1');

    expect(stub).toBeDefined();
    expect(stub!.loaded).toBe(false);
    expect(stub!.exchanges).toHaveLength(0);
    expect(stub!.contextUsagePercent).toBe('25.00');
    expect(fetchConversation).not.toHaveBeenCalled();
    expect(store.hydrated).toBe(true);
  });

  it('loads full content only when a conversation is opened', async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce([
      {
        id: 'local-1',
        conversationId: 'conv-1',
        title: 'Hello',
        type: 'persistent',
        contextUsagePercent: null,
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);

    vi.mocked(fetchConversation).mockResolvedValueOnce({
      sessionId: 's',
      conversationId: 'conv-1',
      content: {
        id: 'local-1',
        conversationId: 'conv-1',
        title: 'Hello',
        exchanges: [
          {
            id: 'ex-1',
            role: 'assistant',
            content: 'Hi',
            status: 'done',
            inputTokenDelta: 100,
            evalCount: 100,
          },
        ],
        savedFileInfos: [],
        uploadedImages: [],
        model: 'llama3',
        numCtx: '4096',
        think: 'medium',
        event: '',
        roomId: '',
        stream: true,
        type: 'persistent',
        createdAt: 1,
        updatedAt: 1,
        contextUsagePercent: '4.88',
      } as never,
    });

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const store = useConversationStore();
    store.setActiveConversation('local-1');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const conversation = store.getConversation('local-1');
    expect(conversation!.loaded).toBe(true);
    expect(conversation!.exchanges).toHaveLength(1);
    expect(fetchConversation).toHaveBeenCalledTimes(1);
  });

  it('does not refetch a conversation that is already loaded', async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce([
      {
        id: 'local-1',
        conversationId: 'conv-1',
        title: 'Hello',
        type: 'persistent',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);
    vi.mocked(fetchConversation).mockResolvedValue({
      sessionId: 's',
      conversationId: 'conv-1',
      content: {
        id: 'local-1',
        conversationId: 'conv-1',
        title: 'Hello',
        exchanges: [],
        savedFileInfos: [],
        uploadedImages: [],
        model: 'llama3',
        numCtx: '4096',
        think: 'medium',
        event: '',
        roomId: '',
        stream: true,
        type: 'persistent',
        createdAt: 1,
        updatedAt: 1,
        contextUsagePercent: null,
      } as never,
    });

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const store = useConversationStore();
    store.setActiveConversation('local-1');
    await new Promise((resolve) => setTimeout(resolve, 0));
    store.setActiveConversation('local-1');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchConversation).toHaveBeenCalledTimes(1);
  });

  it('persists the active conversation id to localStorage', async () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation(
      'temporary',
      'evt',
      'room1',
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(localStorage.getItem('last-active-conversation-id')).toBe(
      conversation.conversationId,
    );
  });

  it('restores the last active conversation on reload', async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce([
      {
        id: 'local-1',
        conversationId: 'conv-1',
        title: 'Hello',
        type: 'persistent',
        contextUsagePercent: '25.00',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);
    vi.mocked(fetchConversation).mockResolvedValue({
      sessionId: 's',
      conversationId: 'conv-1',
      content: {
        id: 'local-1',
        conversationId: 'conv-1',
        title: 'Hello',
        exchanges: [],
        savedFileInfos: [],
        uploadedImages: [],
        model: 'llama3',
        numCtx: '4096',
        think: 'medium',
        event: '',
        roomId: '',
        stream: true,
        type: 'persistent',
        createdAt: 1,
        updatedAt: 1,
        contextUsagePercent: '25.00',
      } as never,
    });
    localStorage.setItem('last-active-conversation-id', 'conv-1');

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const store = useConversationStore();
    expect(store.activeConversationId).toBe('local-1');
  });

  describe('persistence split', () => {
    it('persists unpinned (temporary) conversations to localStorage', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary', 'evt');
      store.addExchange(conversation.id, {
        role: 'user',
        content: 'hi',
        status: 'done',
        conversationId: conversation.conversationId,
      });
      await new Promise((r) => setTimeout(r, 0));

      const map = JSON.parse(
        localStorage.getItem('harness-temporary-conversations') || '{}',
      );
      expect(map[conversation.conversationId]).toBeDefined();
      expect(map[conversation.conversationId].exchanges).toHaveLength(1);
    });

    it('restores unpinned conversations from localStorage on reload', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary', 'evt');
      store.addExchange(conversation.id, {
        role: 'user',
        content: 'hi',
        status: 'done',
        conversationId: conversation.conversationId,
      });
      await new Promise((r) => setTimeout(r, 0));

      setActivePinia(createPinia());
      useConversationStore();
      await new Promise((r) => setTimeout(r, 0));

      const fresh = useConversationStore();
      const restored = fresh.getConversation(conversation.id);
      expect(restored).toBeDefined();
      expect(restored!.type).toBe('temporary');
      expect(restored!.exchanges).toHaveLength(1);
    });

    it('drops unpinned conversations when retention is set to 0', async () => {
      useAppStore().setTemporaryRetentionMinutes(0);

      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary', 'evt');
      store.addExchange(conversation.id, {
        role: 'user',
        content: 'hi',
        status: 'done',
        conversationId: conversation.conversationId,
      });
      await new Promise((r) => setTimeout(r, 0));
      expect(
        JSON.parse(
          localStorage.getItem('harness-temporary-conversations') || '{}',
        )[conversation.conversationId],
      ).toBeDefined();

      setActivePinia(createPinia());
      useConversationStore();
      await new Promise((r) => setTimeout(r, 0));

      const fresh = useConversationStore();
      expect(fresh.getConversation(conversation.id)).toBeUndefined();
      expect(
        JSON.parse(
          localStorage.getItem('harness-temporary-conversations') || '{}',
        ),
      ).toEqual({});
    });

    it('pinning a conversation saves it to the server and clears localStorage', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary', 'evt');
      store.addExchange(conversation.id, {
        role: 'user',
        content: 'hi',
        status: 'done',
        conversationId: conversation.conversationId,
      });
      await new Promise((r) => setTimeout(r, 0));

      store.toggleConversationType(conversation.id);
      await new Promise((r) => setTimeout(r, 0));

      expect(store.getConversation(conversation.id)!.type).toBe('persistent');
      expect(saveConversation).toHaveBeenCalled();
      expect(
        JSON.parse(
          localStorage.getItem('harness-temporary-conversations') || '{}',
        ),
      ).toEqual({});
    });

    it('unpinning a conversation deletes it from the server and keeps it locally', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary', 'evt');
      store.toggleConversationType(conversation.id);
      await new Promise((r) => setTimeout(r, 0));
      expect(store.getConversation(conversation.id)!.type).toBe('persistent');
      vi.mocked(deleteConversation).mockClear();

      store.toggleConversationType(conversation.id);
      await new Promise((r) => setTimeout(r, 0));

      expect(store.getConversation(conversation.id)!.type).toBe('temporary');
      expect(deleteConversation).toHaveBeenCalled();
      const map = JSON.parse(
        localStorage.getItem('harness-temporary-conversations') || '{}',
      );
      expect(map[conversation.conversationId]).toBeDefined();
    });
  });
});
