import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchConversations, saveConversation } from '@/api/conversations.api';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import { toPersistedConversation } from '@/stores/chat/conversation/helpers/to-persisted-conversation.helper';

import { useConversationPersistence } from './use-conversation-persistence';

vi.mock('@/api/conversations.api', () => ({
  fetchConversations: vi.fn(),
  saveConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

const temporaryConversationsMock = vi.hoisted(() => {
  const rows = new Map<string, string>();
  const read = (id: string) =>
    rows.has(id) ? JSON.parse(rows.get(id)!) : undefined;
  const write = async (row: { conversationId: string }) => {
    rows.set(row.conversationId, JSON.stringify(row));
    return row.conversationId;
  };
  const remove = async (id: string) => {
    rows.delete(id);
  };
  const removeMany = async (ids: string[]) => {
    ids.forEach((id) => rows.delete(id));
  };
  const table = {
    toArray: vi.fn(async () =>
      [...rows.values()].map((raw) => JSON.parse(raw)),
    ),
    get: vi.fn(async (id: string) => read(id)),
    put: vi.fn(write),
    delete: vi.fn(remove),
    bulkDelete: vi.fn(removeMany),
    clear: () => rows.clear(),
    snapshot: () =>
      Object.fromEntries([...rows].map(([id, raw]) => [id, JSON.parse(raw)])),
  };
  return {
    table,
    reset: () => {
      table.put.mockImplementation(write);
      table.delete.mockImplementation(remove);
      table.bulkDelete.mockImplementation(removeMany);
    },
  };
});

vi.mock(
  '@/components/chat/composables/persistence/temporary-conversations.db',
  () => ({
    temporaryConversationsDb: {
      temporaryConversations: temporaryConversationsMock.table,
    },
  }),
);

const mockedFetchConversations = vi.mocked(fetchConversations);
const mockedSaveConversation = vi.mocked(saveConversation);

describe('useConversationPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    temporaryConversationsMock.table.clear();
    temporaryConversationsMock.reset();
    mockedFetchConversations.mockResolvedValue([]);
    mockedSaveConversation.mockResolvedValue(undefined);
  });

  it('coalesces adjacent queued local saves and persists the latest plain snapshot', async () => {
    const persistence = useConversationPersistence();
    const conversation = createConversation('New chat', {
      conversationId: 'local-coalesce',
    });

    void persistence.persistConversation(conversation);
    conversation.title = 'Intermediate';
    void persistence.persistConversation(conversation);
    conversation.title = 'Latest';
    void persistence.persistConversation(conversation);
    await persistence.whenConversationPersistenceSettled(
      conversation.conversationId,
    );

    expect(temporaryConversationsMock.table.put).toHaveBeenCalledTimes(2);
    expect(
      temporaryConversationsMock.table.snapshot()[conversation.conversationId]
        .title,
    ).toBe('Latest');
  });

  it('serializes persistent writes and sends the latest queued state', async () => {
    const persistence = useConversationPersistence();
    const conversation = createConversation('New chat', {
      conversationId: 'server-ordered',
      type: 'persistent',
    });
    let finishFirst!: () => void;
    mockedSaveConversation
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finishFirst = resolve;
          }),
      )
      .mockResolvedValue(undefined);

    void persistence.persistConversation(conversation);
    conversation.title = 'Latest server title';
    void persistence.persistConversation(conversation);
    expect(mockedSaveConversation).toHaveBeenCalledTimes(1);

    finishFirst();
    await persistence.whenConversationPersistenceSettled(
      conversation.conversationId,
    );

    expect(mockedSaveConversation).toHaveBeenCalledTimes(2);
    expect(mockedSaveConversation.mock.calls[1][3].title).toBe(
      'Latest server title',
    );
  });

  it('does not coalesce saves across a local deletion barrier', async () => {
    const persistence = useConversationPersistence();
    const conversation = createConversation('Before', {
      conversationId: 'local-barrier',
    });
    const operations: string[] = [];
    temporaryConversationsMock.table.put.mockImplementation(async (row) => {
      operations.push(`put:${row.conversationId}`);
      return row.conversationId;
    });
    temporaryConversationsMock.table.delete.mockImplementation(async (id) => {
      operations.push(`delete:${id}`);
    });

    void persistence.persistConversation(conversation);
    void persistence.removeConversationLocally(conversation.conversationId);
    conversation.title = 'After';
    void persistence.persistConversation(conversation);
    await persistence.whenConversationPersistenceSettled(
      conversation.conversationId,
    );

    expect(operations).toEqual([
      'put:local-barrier',
      'delete:local-barrier',
      'put:local-barrier',
    ]);
    expect(temporaryConversationsMock.table.put).toHaveBeenCalledTimes(2);
  });

  it('loads persistent stubs and only unexpired temporary conversations', async () => {
    const persistence = useConversationPersistence();
    const now = 10_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    mockedFetchConversations.mockResolvedValue([
      {
        id: 'persistent-stub',
        conversationId: 'persistent-stub',
        type: 'persistent',
      } as never,
      {
        id: 'ignored-temporary',
        conversationId: 'ignored-temporary',
        type: 'temporary',
      } as never,
    ]);
    const fresh = toPersistedConversation(
      createConversation('Fresh', {
        conversationId: 'temporary-fresh',
        updatedAt: now,
      }),
    );
    fresh.updatedAt = now;
    const expired = toPersistedConversation(
      createConversation('Expired', {
        conversationId: 'temporary-expired',
      }),
    );
    expired.updatedAt = 0;
    await temporaryConversationsMock.table.put(fresh);
    await temporaryConversationsMock.table.put(expired);
    vi.clearAllMocks();
    mockedFetchConversations.mockResolvedValue([
      {
        id: 'persistent-stub',
        conversationId: 'persistent-stub',
        type: 'persistent',
      } as never,
      {
        id: 'ignored-temporary',
        conversationId: 'ignored-temporary',
        type: 'temporary',
      } as never,
    ]);

    const loaded = await persistence.loadConversations(60);

    expect(loaded.map((conversation) => conversation.conversationId)).toEqual([
      'temporary-fresh',
      'persistent-stub',
    ]);
    expect(loaded[1].loaded).toBe(false);
    expect(temporaryConversationsMock.table.bulkDelete).toHaveBeenCalledWith([
      'temporary-expired',
    ]);
  });

  it('reads a saved temporary conversation for restore detection', async () => {
    const persistence = useConversationPersistence();
    const persisted = toPersistedConversation(
      createConversation('Saved', { conversationId: 'saved-local' }),
    );
    await temporaryConversationsMock.table.put(persisted);

    await expect(
      persistence.loadTemporaryConversation('saved-local'),
    ).resolves.toMatchObject({ conversationId: 'saved-local' });
    await expect(
      persistence.loadTemporaryConversation('missing-local'),
    ).resolves.toBeUndefined();
  });
});
