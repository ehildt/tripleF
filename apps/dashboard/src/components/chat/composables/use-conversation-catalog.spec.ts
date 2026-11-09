import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import { fetchConversation } from '@/api/conversations.api';
import { useConversationSession } from '@/components/chat/shared/composables/use-conversation-session';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import { toPersistedConversation } from '@/stores/chat/conversation/helpers/to-persisted-conversation.helper';
import type { MergedConversation } from '@/types/conversation.model';

import { useConversationCatalog } from './use-conversation-catalog';

vi.mock('@/api/conversations.api', () => ({
  fetchConversation: vi.fn(),
}));

const persistence = vi.hoisted(() => ({
  loadConversations: vi.fn(),
  loadTemporaryConversation: vi.fn(),
  persistConversation: vi.fn(async () => {}),
  removeConversationLocally: vi.fn(async () => {}),
  deletePersistentConversation: vi.fn(async () => {}),
}));

vi.mock('./use-conversation-persistence', () => ({
  useConversationPersistence: () => persistence,
}));

const mockedFetchConversation = vi.mocked(fetchConversation);

function merged(
  conversationId: string,
  title = 'Restored',
): MergedConversation {
  const content = toPersistedConversation(
    createConversation(title, { conversationId }),
  );
  return {
    sessionId: 'session',
    conversationId,
    latestRequestId: conversationId,
    title,
    content: content as never,
    updatedAt: new Date(),
  };
}

function stub(conversationId: string, id = conversationId) {
  const conversation = createConversation('Stub', {
    id,
    conversationId,
    type: 'persistent',
  });
  conversation.id = id;
  conversation.loaded = false;
  return conversation;
}

describe('useConversationCatalog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useConversationSession().setActiveConversationId(null);
    localStorage.clear();
    vi.clearAllMocks();
    persistence.loadConversations.mockResolvedValue([]);
    persistence.loadTemporaryConversation.mockResolvedValue(undefined);
    persistence.persistConversation.mockResolvedValue(undefined);
    persistence.removeConversationLocally.mockResolvedValue(undefined);
    persistence.deletePersistentConversation.mockResolvedValue(undefined);
  });

  it('creates a fully initialized conversation with one initial persist', () => {
    const catalog = useConversationCatalog();

    const conversation = catalog.createNewConversation(
      'persistent',
      'event-1',
      'room-1',
      {
        title: 'Named',
        model: 'llama3',
        stream: false,
        subscriptions: [{ event: 'event-1', roomId: 'room-1' }],
      },
    );

    expect(conversation).toMatchObject({
      title: 'Named',
      type: 'persistent',
      model: 'llama3',
      stream: false,
      event: 'event-1',
      roomId: 'room-1',
      loaded: true,
    });
    expect(conversation.subscriptions).toHaveLength(1);
    expect(useConversationSession().activeConversationId.value).toBe(
      conversation.id,
    );
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);
    expect(persistence.persistConversation).toHaveBeenCalledWith(conversation);
  });

  it('ensures one active conversation and dedupes restored records', async () => {
    const catalog = useConversationCatalog();
    const ensured = catalog.ensureConversation();
    expect(catalog.ensureConversation().id).toBe(ensured.id);

    const recovered = createConversation('Recovered', {
      conversationId: 'recovered',
    });
    expect(catalog.restoreConversation(recovered).id).toBe(recovered.id);
    expect(catalog.restoreConversation(recovered).id).toBe(recovered.id);
    expect(useConversationStore().conversations).toHaveLength(2);
    expect(useConversationSession().activeConversationId.value).toBe(
      ensured.id,
    );
  });

  it('restores a saved temporary conversation without a server fetch', async () => {
    const local = createConversation('Local', {
      conversationId: 'saved-local',
    });
    persistence.loadConversations.mockResolvedValue([local]);
    persistence.loadTemporaryConversation.mockResolvedValue(
      toPersistedConversation(local),
    );
    localStorage.setItem('last-active-conversation-id', local.conversationId);

    await useConversationCatalog().bootstrapConversations();

    expect(mockedFetchConversation).not.toHaveBeenCalled();
    expect(useConversationSession().activeConversationId.value).toBe(local.id);
    expect(useConversationStore().hydrated).toBe(true);
  });

  it('starts full-content restore before the list settles and applies it once', async () => {
    const saved = stub('saved-persistent');
    let finishList!: (value: (typeof saved)[]) => void;
    persistence.loadConversations.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishList = resolve;
        }),
    );
    localStorage.setItem('last-active-conversation-id', saved.conversationId);
    mockedFetchConversation.mockResolvedValue(merged(saved.conversationId));

    const bootstrap = useConversationCatalog().bootstrapConversations();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockedFetchConversation).toHaveBeenCalledWith(
      expect.any(String),
      saved.conversationId,
    );

    finishList([saved]);
    await bootstrap;

    expect(useConversationStore().conversations).toHaveLength(1);
    expect(saved.loaded).toBe(true);
    expect(useConversationSession().activeConversationId.value).toBe(saved.id);
  });

  it('clears an absent 404 bookmark but keeps a listed stub on failure', async () => {
    localStorage.setItem('last-active-conversation-id', 'missing');
    mockedFetchConversation.mockResolvedValue(null);
    await useConversationCatalog().bootstrapConversations();
    expect(localStorage.getItem('last-active-conversation-id')).toBeNull();

    const saved = stub('offline-stub');
    persistence.loadConversations.mockResolvedValue([saved]);
    localStorage.setItem('last-active-conversation-id', saved.conversationId);
    mockedFetchConversation.mockRejectedValue(new Error('offline'));
    await useConversationCatalog().bootstrapConversations();

    expect(useConversationSession().activeConversationId.value).toBe(saved.id);
    expect(saved.loaded).toBe(false);
    expect(localStorage.getItem('last-active-conversation-id')).toBe(
      saved.conversationId,
    );
  });

  it('does not let a late restore hijack a newer user selection', async () => {
    const saved = stub('saved');
    persistence.loadConversations.mockResolvedValue([saved]);
    localStorage.setItem('last-active-conversation-id', saved.conversationId);
    let finishFetch!: () => void;
    mockedFetchConversation.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishFetch = () => resolve(merged(saved.conversationId));
        }),
    );
    const catalog = useConversationCatalog();
    const bootstrap = catalog.bootstrapConversations();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const selected = catalog.createNewConversation();

    finishFetch();
    await bootstrap;

    expect(useConversationSession().activeConversationId.value).toBe(
      selected.id,
    );
  });

  it('joins a user click into the in-flight restore', async () => {
    const saved = stub('joined');
    persistence.loadConversations.mockResolvedValue([saved]);
    localStorage.setItem('last-active-conversation-id', saved.conversationId);
    let finishFetch!: () => void;
    mockedFetchConversation.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishFetch = () => resolve(merged(saved.conversationId));
        }),
    );
    const catalog = useConversationCatalog();
    const bootstrap = catalog.bootstrapConversations();
    await new Promise((resolve) => setTimeout(resolve, 0));

    catalog.setActiveConversation(saved.id);
    catalog.setActiveConversation(saved.id);
    expect(mockedFetchConversation).toHaveBeenCalledTimes(1);
    finishFetch();
    await bootstrap;
    expect(saved.loaded).toBe(true);
  });

  it('loads full content only when a stub is opened', async () => {
    const catalog = useConversationCatalog();
    const conversation = stub('lazy');
    useConversationStore().insertConversation(conversation);
    mockedFetchConversation.mockResolvedValue(
      merged(conversation.conversationId),
    );

    await expect(catalog.loadConversation(conversation.id)).resolves.toBe(true);
    await catalog.loadConversation(conversation.id);
    await catalog.loadConversation(conversation.id);

    expect(mockedFetchConversation).toHaveBeenCalledTimes(1);
    expect(conversation.loaded).toBe(true);
  });

  it('moves pin destinations through explicit persistence barriers', async () => {
    const catalog = useConversationCatalog();
    const conversation = catalog.createNewConversation('temporary');

    await catalog.toggleConversationType(conversation.id);
    expect(conversation.type).toBe('persistent');
    expect(persistence.removeConversationLocally).toHaveBeenCalledWith(
      conversation.conversationId,
    );

    await catalog.toggleConversationType(conversation.id);
    expect(conversation.type).toBe('temporary');
    expect(persistence.deletePersistentConversation).toHaveBeenCalledWith(
      conversation.conversationId,
    );
  });

  it('persists active bookmarks through the catalog watcher', async () => {
    const scope = effectScope();
    const catalog = useConversationCatalog();
    scope.run(() => catalog.watchActiveConversationBookmark());
    const conversation = catalog.createNewConversation();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(localStorage.getItem('last-active-conversation-id')).toBe(
      conversation.conversationId,
    );
    useConversationSession().setActiveConversationId(null);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(localStorage.getItem('last-active-conversation-id')).toBeNull();
    scope.stop();
  });
});
