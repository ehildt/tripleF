import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteConversation,
  fetchConversation,
  fetchConversations,
  saveConversation,
} from '../../api/conversations.api';
import { deleteUploadedObject } from '../../api/object-storage.api';
import { useAppStore } from '../app/app.store';
import { useConversationStore } from './conversation.store';

vi.mock('../../api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../api/object-storage.api', () => ({
  deleteUploadedObject: vi.fn().mockResolvedValue(undefined),
}));

/**
 * In-memory stand-in for the Dexie `temporaryConversations` table: vitest
 * `vi.mock` with a per-spec row map (jsdom has no IndexedDB). Rows are
 * JSON-serialized on write so later in-place mutations cannot leak into the
 * store, mirroring IndexedDB's structured clone.
 */
const temporaryConversationsMock = vi.hoisted(() => {
  const rows = new Map<string, string>();
  const read = (id: string) =>
    rows.has(id) ? JSON.parse(rows.get(id) as string) : undefined;
  const table = {
    toArray: vi.fn(async () =>
      [...rows.values()].map((raw) => JSON.parse(raw)),
    ),
    get: vi.fn(async (id: string) => read(id)),
    put: vi.fn(async (row: { conversationId: string }) => {
      rows.set(row.conversationId, JSON.stringify(row));
      return row.conversationId;
    }),
    delete: vi.fn(async (id: string) => {
      rows.delete(id);
    }),
    bulkDelete: vi.fn(async (ids: string[]) => {
      ids.forEach((id) => rows.delete(id));
    }),
    clear: () => rows.clear(),
    snapshot: () =>
      Object.fromEntries([...rows].map(([k, raw]) => [k, JSON.parse(raw)])),
  };
  return { table };
});

vi.mock('./helpers/temporary-conversations.db', () => ({
  temporaryConversationsDb: {
    temporaryConversations: temporaryConversationsMock.table,
  },
}));

describe('useConversationStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    temporaryConversationsMock.table.clear();
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

    expect(conversation.exchanges).toHaveLength(0);
    expect(conversation.uploadedImages).toHaveLength(0);
    expect(store.conversations).toHaveLength(0);
  });

  it('deleteCurrentConversation only deletes stored objects that are no longer referenced', async () => {
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

  it('buildPrompt returns text-only messages for included exchanges', async () => {
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
      responseTemplate: 'text',
      text: 'Hi there',
    });
    store.addExchange(conversation.id, {
      role: 'user',
      content: 'ignored',
      status: 'done',
      conversationId,
      included: false,
    });

    const prompt = await store.buildPrompt(conversation.id);
    const messages = JSON.parse(prompt);

    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ role: 'user', content: 'Hello' });
    expect(messages[1]).toEqual({ role: 'assistant', content: 'Hi there' });
  });

  it('buildPrompt prefers text field and serializes harness data when text is absent', async () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation('temporary');

    store.addExchange(conversation.id, {
      role: 'assistant',
      content: 'summary text',
      status: 'done',
      conversationId: conversation.conversationId,
      responseTemplate: 'article',
      responseData: { title: 'Title', sectionContent: 'Body' } as any,
      text: 'body text',
      model: 'llama3',
    });

    const messages = JSON.parse(await store.buildPrompt(conversation.id));

    expect(messages).toEqual([
      { role: 'assistant', content: '[Template: article]\nbody text' },
    ]);

    const conversation2 = store.createNewConversation('temporary');
    store.addExchange(conversation2.id, {
      role: 'assistant',
      content: 'fallback',
      status: 'done',
      conversationId: conversation2.conversationId,
      responseTemplate: 'article',
      responseData: {
        category: 'Gaming',
        title: 'Neverness to Everness',
        sectionContent: 'An open-world RPG.',
      } as any,
      model: 'llama3',
    });

    const messages2 = JSON.parse(await store.buildPrompt(conversation2.id));
    expect(messages2).toHaveLength(1);
    expect(messages2[0].role).toBe('assistant');
    expect(messages2[0].content).toContain('Title: Neverness to Everness');
    expect(messages2[0].content).toContain('An open-world RPG.');
  });

  it('buildPrompt returns an empty array for unknown conversation ids', async () => {
    const store = useConversationStore();
    expect(await store.buildPrompt('missing-id')).toBe('[]');
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

  /** Resolve/reject outside the promise constructor for timing control. */
  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  function conversationContent(
    exchanges: unknown[] = [],
  ): Record<string, unknown> {
    return {
      id: 'local-1',
      conversationId: 'conv-1',
      title: 'Hello',
      exchanges,
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
    };
  }

  function stubSnapshot(): Record<string, unknown> {
    return {
      id: 'local-1',
      conversationId: 'conv-1',
      title: 'Hello',
      type: 'persistent',
      contextUsagePercent: '25.00',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
  }

  it('fetches the saved conversation in parallel with the stub list', async () => {
    const list = deferred<unknown[]>();
    const single = deferred<unknown>();
    vi.mocked(fetchConversations).mockReturnValueOnce(
      list.promise as Promise<never>,
    );
    vi.mocked(fetchConversation).mockReturnValueOnce(
      single.promise as Promise<never>,
    );
    localStorage.setItem('last-active-conversation-id', 'conv-1');

    setActivePinia(createPinia());
    useConversationStore();

    // Let the is-it-local IndexedDB check settle. The restore is then issued
    // while the list request is still pending — it never waits for the list.
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchConversations).toHaveBeenCalled();
    expect(fetchConversation).toHaveBeenCalledWith(
      expect.any(String),
      'conv-1',
    );

    single.resolve({
      sessionId: 's',
      conversationId: 'conv-1',
      content: conversationContent(),
    });
    await new Promise((r) => setTimeout(r, 0));
    list.resolve([stubSnapshot()]);
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    const store = useConversationStore();
    expect(store.activeConversationId).toBe('local-1');
    expect(store.getConversation('local-1')!.loaded).toBe(true);
  });

  it('lands a restore that resolves before the list without duplicates', async () => {
    const list = deferred<unknown[]>();
    vi.mocked(fetchConversations).mockReturnValueOnce(
      list.promise as Promise<never>,
    );
    vi.mocked(fetchConversation).mockResolvedValueOnce({
      sessionId: 's',
      conversationId: 'conv-1',
      content: conversationContent([
        { id: 'ex-1', role: 'assistant', content: 'Hi', status: 'done' },
      ]),
    });
    localStorage.setItem('last-active-conversation-id', 'conv-1');

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((r) => setTimeout(r, 0));

    list.resolve([stubSnapshot()]);
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    const store = useConversationStore();
    expect(store.getConversation('local-1')).toBeDefined();
    expect(store.conversations).toHaveLength(1);
    expect(store.getConversation('local-1')!.loaded).toBe(true);
    expect(store.getConversation('local-1')!.exchanges).toHaveLength(1);
    expect(store.activeConversationId).toBe('local-1');
  });

  it('inserts a restored conversation absent from the snapshot list', async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce([]);
    vi.mocked(fetchConversation).mockResolvedValueOnce({
      sessionId: 's',
      conversationId: 'conv-1',
      content: conversationContent(),
    });
    localStorage.setItem('last-active-conversation-id', 'conv-1');

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    const store = useConversationStore();
    expect(store.conversations).toHaveLength(1);
    expect(store.activeConversationId).toBe('local-1');
    expect(store.getConversation('local-1')!.loaded).toBe(true);
  });

  it('clears a stale bookmark when the saved conversation 404s and is absent from the list', async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce([]);
    vi.mocked(fetchConversation).mockResolvedValueOnce(null);
    localStorage.setItem('last-active-conversation-id', 'conv-1');

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    const store = useConversationStore();
    expect(localStorage.getItem('last-active-conversation-id')).toBeNull();
    expect(store.activeConversationId).toBeNull();
  });

  it('keeps a stub active and the bookmark on a 404 when the list still has it', async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce([stubSnapshot()]);
    vi.mocked(fetchConversation).mockResolvedValueOnce(null);
    localStorage.setItem('last-active-conversation-id', 'conv-1');

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    const store = useConversationStore();
    expect(store.activeConversationId).toBe('local-1');
    expect(store.getConversation('local-1')!.loaded).toBe(false);
    expect(localStorage.getItem('last-active-conversation-id')).toBe('conv-1');
  });

  it('keeps the bookmark on network failure and leaves the stub lazily loadable', async () => {
    vi.mocked(fetchConversations).mockResolvedValueOnce([stubSnapshot()]);
    vi.mocked(fetchConversation).mockRejectedValueOnce(new Error('offline'));
    localStorage.setItem('last-active-conversation-id', 'conv-1');

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    const store = useConversationStore();
    expect(localStorage.getItem('last-active-conversation-id')).toBe('conv-1');
    expect(store.activeConversationId).toBe('local-1');
    expect(store.getConversation('local-1')!.loaded).toBe(false);
  });

  it('does not fetch a saved temporary conversation from the server', async () => {
    const store = useConversationStore();
    const conversation = store.createNewConversation('temporary', 'evt');
    store.addExchange(conversation.id, {
      role: 'user',
      content: 'hi',
      status: 'done',
      conversationId: conversation.conversationId,
    });
    await new Promise((r) => setTimeout(r, 0));
    localStorage.setItem(
      'last-active-conversation-id',
      conversation.conversationId,
    );
    vi.mocked(fetchConversation).mockClear();

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    const fresh = useConversationStore();
    expect(fetchConversation).not.toHaveBeenCalled();
    expect(fresh.activeConversationId).toBe(conversation.id);
    expect(fresh.getConversation(conversation.id)!.loaded).toBe(true);
  });

  it('dedupes a user click on the restoring conversation into the boot fetch', async () => {
    const single = deferred<unknown>();
    vi.mocked(fetchConversations).mockResolvedValueOnce([stubSnapshot()]);
    vi.mocked(fetchConversation).mockReturnValueOnce(
      single.promise as Promise<never>,
    );
    localStorage.setItem('last-active-conversation-id', 'conv-1');

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((r) => setTimeout(r, 0));

    const store = useConversationStore();
    store.setActiveConversation('local-1');
    store.setActiveConversation('local-1');
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchConversation).toHaveBeenCalledTimes(1);

    single.resolve({
      sessionId: 's',
      conversationId: 'conv-1',
      content: conversationContent(),
    });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(store.getConversation('local-1')!.loaded).toBe(true);
    expect(store.activeConversationId).toBe('local-1');
  });

  describe('persistence split', () => {
    it('persists a newly created chat immediately, before any activity', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary', 'evt');
      await new Promise((r) => setTimeout(r, 0));

      expect(
        temporaryConversationsMock.table.snapshot()[
          conversation.conversationId
        ],
      ).toBeDefined();
    });

    it('persists the lazily ensured chat at creation', async () => {
      const store = useConversationStore();
      const conversation = store.ensureConversation();
      await new Promise((r) => setTimeout(r, 0));

      expect(
        temporaryConversationsMock.table.snapshot()[
          conversation.conversationId
        ],
      ).toBeDefined();
    });

    it('persists a newly created pinned chat to the server', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('persistent', 'evt');
      await new Promise((r) => setTimeout(r, 0));

      const saveCalls = vi.mocked(saveConversation).mock.calls;
      expect(saveCalls.length).toBeGreaterThan(0);
      expect(saveCalls[0][1]).toBe(conversation.conversationId);
      expect(
        temporaryConversationsMock.table.snapshot()[
          conversation.conversationId
        ],
      ).toBeUndefined();
    });

    it('persists unpinned (temporary) conversations to IndexedDB', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary', 'evt');
      store.addExchange(conversation.id, {
        role: 'user',
        content: 'hi',
        status: 'done',
        conversationId: conversation.conversationId,
      });
      await new Promise((r) => setTimeout(r, 0));

      const map = temporaryConversationsMock.table.snapshot();
      expect(map[conversation.conversationId]).toBeDefined();
      expect(map[conversation.conversationId].exchanges).toHaveLength(1);
    });

    it('restores unpinned conversations from IndexedDB on reload', async () => {
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
        temporaryConversationsMock.table.snapshot()[
          conversation.conversationId
        ],
      ).toBeDefined();

      setActivePinia(createPinia());
      useConversationStore();
      await new Promise((r) => setTimeout(r, 0));

      const fresh = useConversationStore();
      expect(fresh.getConversation(conversation.id)).toBeUndefined();
      expect(temporaryConversationsMock.table.snapshot()).toEqual({});
    });

    it('pinning a conversation saves it to the server and clears IndexedDB', async () => {
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
      expect(temporaryConversationsMock.table.snapshot()).toEqual({});
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
      expect(
        temporaryConversationsMock.table.snapshot()[
          conversation.conversationId
        ],
      ).toBeDefined();
    });
  });

  describe('pdf page group actions', () => {
    function seedPdfPages(store: ReturnType<typeof useConversationStore>) {
      const conversation = store.createNewConversation('temporary', 'evt');
      const cid = store.getConversationId(conversation.id);
      store.setUploadedImages(conversation.id, [
        {
          name: 'doc.pdf · page 1',
          hash: 'p1',
          page: 1,
          parentHash: 'doc-hash',
          parentName: 'doc.pdf',
          uploadedAt: 0,
          selected: true,
          conversationId: cid,
        },
        {
          name: 'doc.pdf · page 2',
          hash: 'p2',
          page: 2,
          parentHash: 'doc-hash',
          parentName: 'doc.pdf',
          uploadedAt: 0,
          selected: true,
          conversationId: cid,
        },
        {
          name: 'cat.png',
          hash: 'img1',
          uploadedAt: 0,
          conversationId: cid,
        },
      ]);
      return { conversation, cid };
    }

    it('sets the selection of every page of a pdf in one write', () => {
      const store = useConversationStore();
      const { conversation, cid } = seedPdfPages(store);

      store.setUploadedImagesSelectedForParent(
        conversation.id,
        'doc-hash',
        false,
        cid,
      );

      const images = store.getUploadedImagesForConversation(
        conversation.id,
        cid,
      );
      expect(images.find((i) => i.hash === 'p1')?.selected).toBe(false);
      expect(images.find((i) => i.hash === 'p2')?.selected).toBe(false);
      expect(images.find((i) => i.hash === 'img1')?.selected).not.toBe(false);
    });

    it('removes every page of a pdf in one write', () => {
      const store = useConversationStore();
      const { conversation, cid } = seedPdfPages(store);

      store.removeUploadedImagesForParent(conversation.id, 'doc-hash', cid);

      const images = store.getUploadedImagesForConversation(
        conversation.id,
        cid,
      );
      expect(images.map((i) => i.hash)).toEqual(['img1']);
    });
  });

  describe('exchange mutation API', () => {
    it('renames a conversation', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');

      store.renameConversation(conversation.id, 'New title');

      expect(conversation.title).toBe('New title');
    });

    it('infers a title from the first user exchange', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');

      store.addExchange(conversation.id, {
        role: 'user',
        content: 'How do black holes form?',
        status: 'done',
        conversationId: conversation.conversationId,
      });

      expect(conversation.title).toContain('black holes');
      expect(conversation.exchanges).toHaveLength(1);
      expect(conversation.exchanges[0].id).toBeTruthy();
    });

    it('updates assistant content and status by request id', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.addExchange(conversation.id, {
        role: 'assistant',
        content: '',
        status: 'pending',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });

      store.updateExchange(conversation.id, 'req-1', {
        content: 'answer',
        status: 'done',
      });

      expect(conversation.exchanges[0]).toMatchObject({
        content: 'answer',
        status: 'done',
      });
    });

    it('ignores updates for unknown request ids and conversations', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.addExchange(conversation.id, {
        role: 'assistant',
        content: 'kept',
        status: 'done',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });

      store.updateExchange(conversation.id, 'other', { content: 'nope' });
      store.updateExchange('missing', 'req-1', { content: 'nope' });

      expect(conversation.exchanges[0].content).toBe('kept');
    });

    it('appends streamed chunks and marks the exchange streaming', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.addExchange(conversation.id, {
        role: 'assistant',
        content: 'Hel',
        status: 'pending',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });

      store.appendExchangeContent(conversation.id, 'req-1', 'lo');

      expect(conversation.exchanges[0]).toMatchObject({
        content: 'Hello',
        status: 'streaming',
      });
    });

    it('marks an exchange done and records token counts', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.addExchange(conversation.id, {
        role: 'assistant',
        content: 'answer',
        status: 'streaming',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });

      store.markExchangeDone(conversation.id, 'req-1', {
        promptEvalCount: 120,
        evalCount: 30,
      });

      expect(conversation.exchanges[0]).toMatchObject({
        status: 'done',
        promptEvalCount: 120,
        evalCount: 30,
      });
    });

    it('marks an exchange done without token data', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.addExchange(conversation.id, {
        role: 'assistant',
        content: 'answer',
        status: 'streaming',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });

      store.markExchangeDone(conversation.id, 'req-1');

      expect(conversation.exchanges[0].status).toBe('done');
    });

    it('marks an exchange as failed and stores the message', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.addExchange(conversation.id, {
        role: 'assistant',
        content: '',
        status: 'pending',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });

      store.markExchangeError(conversation.id, 'req-1', 'boom');

      expect(conversation.exchanges[0]).toMatchObject({
        status: 'error',
        content: 'boom',
      });
    });

    it('marks an exchange as failed without overwriting its content', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.addExchange(conversation.id, {
        role: 'assistant',
        content: 'partial',
        status: 'streaming',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });

      store.markExchangeError(conversation.id, 'req-1');

      expect(conversation.exchanges[0]).toMatchObject({
        status: 'error',
        content: 'partial',
      });
    });

    it('toggles inclusion of a paired user exchange', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.addExchange(conversation.id, {
        role: 'user',
        content: 'question',
        status: 'done',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });
      store.addExchange(conversation.id, {
        role: 'assistant',
        content: 'answer',
        status: 'done',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });
      const userId = conversation.exchanges[0].id;

      store.toggleExchangeIncluded(conversation.id, userId);

      expect(conversation.exchanges[0].included).toBe(false);
      expect(conversation.exchanges[1].included).toBe(false);
    });

    it('prunes a paired exchange on delete', async () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.addExchange(conversation.id, {
        role: 'user',
        content: 'question',
        status: 'done',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });
      store.addExchange(conversation.id, {
        role: 'assistant',
        content: 'answer',
        status: 'done',
        requestId: 'req-1',
        conversationId: conversation.conversationId,
      });

      store.deleteExchangeAndPrune(
        conversation.id,
        conversation.exchanges[0].id,
      );

      expect(conversation.exchanges).toHaveLength(0);
    });
  });

  describe('conversation settings', () => {
    it('ignores patches for unknown conversations', () => {
      const store = useConversationStore();

      expect(() => store.setModel('missing', 'llama3')).not.toThrow();
    });

    it('returns the server conversation id, minting one when absent', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');

      expect(store.getConversationId(conversation.id)).toBe(
        conversation.conversationId,
      );

      conversation.conversationId = '';
      expect(store.getConversationId(conversation.id)).toBeTruthy();
    });

    it('mints a fresh id for an unknown conversation', () => {
      const store = useConversationStore();

      expect(store.getConversationId('missing')).toBeTruthy();
    });

    it('sets a new server conversation id', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');

      store.setConversationId(conversation.id, 'server-id');

      expect(conversation.conversationId).toBe('server-id');
    });

    it('stores subscriptions', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      const subscriptions = [{ event: 'e', roomId: 'r' }] as never;

      store.setSubscriptions(conversation.id, subscriptions);

      expect(conversation.subscriptions).toEqual(subscriptions);
    });
  });

  describe('attached files', () => {
    it('stores files with their saved info', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      const file = new File(['body'], 'notes.txt', { type: 'text/plain' });

      store.setFiles(conversation.id, [file]);

      expect(store.getFiles(conversation.id)).toEqual([file]);
      expect(conversation.savedFileInfos).toHaveLength(1);
      expect(conversation.savedFileInfos[0].name).toBe('notes.txt');
    });

    it('falls back to the conversation files for unknown ids', () => {
      const store = useConversationStore();

      expect(store.getFiles('missing')).toEqual([]);
    });
  });

  describe('uploaded images', () => {
    const image = (
      hash: string,
      conversationId: string,
      overrides: Record<string, unknown> = {},
    ) => ({
      name: `${hash}.png`,
      hash,
      uploadedAt: 1,
      conversationId,
      selected: true,
      ...overrides,
    });

    it('merges images into the conversation', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');

      store.setUploadedImages(conversation.id, [
        image('a', conversation.conversationId),
      ] as never);

      expect(conversation.uploadedImages).toHaveLength(1);
    });

    it('reads images for the target conversation only', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.setUploadedImages(conversation.id, [
        image('a', conversation.conversationId),
        image('b', 'other'),
      ] as never);

      expect(
        store.getUploadedImagesForConversation(conversation.id),
      ).toHaveLength(1);
      expect(
        store.getUploadedImagesForConversation(conversation.id, 'other'),
      ).toHaveLength(1);
      expect(store.getUploadedImagesForConversation('missing')).toEqual([]);
    });

    it('detects an existing image reference by hash', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.setUploadedImages(conversation.id, [
        image('a', conversation.conversationId),
      ] as never);

      expect(store.hasUploadedImageReference(conversation.id, 'a')).toBe(true);
      expect(store.hasUploadedImageReference(conversation.id, 'b')).toBe(false);
      expect(store.hasUploadedImageReference('missing', 'a')).toBe(false);
    });

    it('ignores the reference when it belongs to the excluded context', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.setUploadedImages(conversation.id, [image('a', 'ctx-1')] as never);

      expect(
        store.hasUploadedImageReference(conversation.id, 'a', 'ctx-1'),
      ).toBe(false);
      expect(
        store.hasUploadedImageReference(conversation.id, 'a', 'ctx-2'),
      ).toBe(true);
    });

    it('toggles the selection of a hash', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.setUploadedImages(conversation.id, [
        image('a', conversation.conversationId),
      ] as never);

      store.toggleUploadedImageSelected(conversation.id, 'a');
      expect(conversation.uploadedImages[0].selected).toBe(false);

      store.toggleUploadedImageSelected(conversation.id, 'a');
      expect(conversation.uploadedImages[0].selected).toBe(true);
    });

    it('snapshots, restores and deselects image selections', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.setUploadedImages(conversation.id, [
        image('a', conversation.conversationId),
      ] as never);

      store.snapshotImageSelections(conversation.id);
      expect(conversation.imageSelectionSnapshot).toEqual({ a: true });

      conversation.uploadedImages[0].selected = false;
      store.restoreImageSelections(conversation.id);
      expect(conversation.uploadedImages[0].selected).toBe(true);

      store.deselectAllImages(conversation.id);
      expect(conversation.uploadedImages[0].selected).toBe(false);
    });

    it('skips restore when no snapshot exists', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.setUploadedImages(conversation.id, [
        image('a', conversation.conversationId),
      ] as never);

      store.restoreImageSelections(conversation.id);

      expect(conversation.uploadedImages[0].selected).toBe(true);
    });

    it('removes a single image', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      const cid = conversation.conversationId;
      store.setUploadedImages(conversation.id, [
        image('a', cid),
        image('b', cid),
      ] as never);

      store.removeUploadedImage(conversation.id, 'a');

      expect(conversation.uploadedImages.map((i) => i.hash)).toEqual(['b']);
    });

    it('selects and removes every page image of one pdf', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      const cid = conversation.conversationId;
      store.setUploadedImages(conversation.id, [
        image('p1', cid, { parentHash: 'pdf' }),
        image('p2', cid, { parentHash: 'pdf' }),
        image('other', cid),
      ] as never);

      store.setUploadedImagesSelectedForParent(conversation.id, 'pdf', false);
      expect(
        conversation.uploadedImages
          .filter((i) => i.parentHash === 'pdf')
          .every((i) => i.selected === false),
      ).toBe(true);

      store.removeUploadedImagesForParent(conversation.id, 'pdf');
      expect(conversation.uploadedImages.map((i) => i.hash)).toEqual(['other']);
    });

    it('writes nothing when no page image matches the parent', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.setUploadedImages(conversation.id, [
        image('other', conversation.conversationId),
      ] as never);

      store.setUploadedImagesSelectedForParent(conversation.id, 'pdf', false);
      store.removeUploadedImagesForParent(conversation.id, 'pdf');

      expect(conversation.uploadedImages).toHaveLength(1);
    });
  });

  describe('uploaded documents', () => {
    const doc = (
      hash: string,
      conversationId: string,
      overrides: Record<string, unknown> = {},
    ) => ({
      name: `${hash}.pdf`,
      hash,
      type: 'application/pdf',
      uploadedAt: 1,
      selected: true,
      conversationId,
      ...overrides,
    });

    it('merges, reads, toggles and removes documents', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.setUploadedDocuments(conversation.id, [
        doc('a', conversation.conversationId),
      ] as never);

      expect(
        store.getUploadedDocumentsForConversation(conversation.id),
      ).toHaveLength(1);
      expect(store.getUploadedDocumentsForConversation('missing')).toEqual([]);

      store.toggleUploadedDocumentSelected(conversation.id, 'a');
      expect(conversation.uploadedDocuments[0].selected).toBe(false);

      store.removeUploadedDocument(conversation.id, 'a');
      expect(conversation.uploadedDocuments).toHaveLength(0);
    });

    it('scopes documents to the target conversation', () => {
      const store = useConversationStore();
      const conversation = store.createNewConversation('temporary');
      store.setUploadedDocuments(conversation.id, [doc('a', 'ctx-1')] as never);

      expect(
        store.getUploadedDocumentsForConversation(conversation.id, 'ctx-1'),
      ).toHaveLength(1);
      expect(
        store.getUploadedDocumentsForConversation(conversation.id, 'ctx-2'),
      ).toHaveLength(0);
    });
  });
});
