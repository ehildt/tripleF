import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';

import { useConversationConfiguration } from './use-conversation-configuration';

const catalog = vi.hoisted(() => ({ loadConversationForWrite: vi.fn() }));
const persistence = vi.hoisted(() => ({
  persistConversation: vi.fn(async () => {}),
}));

vi.mock('./use-conversation-catalog', () => ({
  useConversationCatalog: () => catalog,
}));
vi.mock('./use-conversation-persistence', () => ({
  useConversationPersistence: () => persistence,
}));

describe('useConversationConfiguration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    persistence.persistConversation.mockResolvedValue(undefined);
    catalog.loadConversationForWrite.mockImplementation(async (id: string) =>
      useConversationStore().getConversation(id),
    );
  });

  it('persists model and socket configuration patches', async () => {
    const conversation = createConversation('New chat');
    useConversationStore().insertConversation(conversation, true);
    const configuration = useConversationConfiguration();

    await configuration.setModel(conversation.id, 'llama3');
    await configuration.setNumCtx(conversation.id, '8192');
    await configuration.setThink(conversation.id, 'high');
    await configuration.setStream(conversation.id, false);
    await configuration.setEvent(conversation.id, 'event');
    await configuration.setRoomId(conversation.id, 'room');

    expect(conversation).toMatchObject({
      model: 'llama3',
      numCtx: '8192',
      think: 'high',
      stream: false,
      event: 'event',
      roomId: 'room',
    });
    expect(persistence.persistConversation).toHaveBeenCalledTimes(6);
  });

  it('stores stable ids, subscriptions, and saved file metadata', async () => {
    const conversation = createConversation('New chat');
    useConversationStore().insertConversation(conversation, true);
    const configuration = useConversationConfiguration();
    const file = new File(['body'], 'notes.txt', { type: 'text/plain' });

    await configuration.setConversationId(conversation.id, 'server-id');
    await configuration.setSubscriptions(conversation.id, [
      { event: 'event', roomId: 'room' },
    ]);
    await configuration.setSavedFileInfos(conversation.id, [file]);

    expect(conversation.conversationId).toBe('server-id');
    expect(conversation.subscriptions).toHaveLength(1);
    expect(conversation).not.toHaveProperty('files');
    expect(conversation.savedFileInfos[0].name).toBe('notes.txt');
  });

  it('hydrates a stub before changing configuration', async () => {
    const conversation = createConversation('New chat', { loaded: false });
    useConversationStore().insertConversation(conversation, true);
    catalog.loadConversationForWrite.mockImplementation(async (id: string) => {
      const loaded = useConversationStore().getConversation(id)!;
      loaded.loaded = true;
      return loaded;
    });

    await useConversationConfiguration().setModel(
      conversation.id,
      'loaded-model',
    );

    expect(conversation.model).toBe('loaded-model');
    expect(persistence.persistConversation).toHaveBeenCalledTimes(1);
  });

  it('ignores an unknown record without persisting', async () => {
    await useConversationConfiguration().patchConversation('missing', {
      model: 'llama3',
    });

    expect(persistence.persistConversation).not.toHaveBeenCalled();
  });
});
