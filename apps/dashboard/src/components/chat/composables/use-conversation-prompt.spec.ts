import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';

import { useConversationPrompt } from './use-conversation-prompt';

describe('useConversationPrompt', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('serializes included exchanges as turndown text messages', async () => {
    const conversation = createConversation('New chat');
    useConversationStore().insertConversation(conversation);
    const store = useConversationStore();
    store.addExchange(
      conversation.id,
      {
        role: 'user',
        content: '<p>Hello</p>',
        status: 'done',
        conversationId: conversation.conversationId,
      },
      'New chat',
    );
    store.addExchange(
      conversation.id,
      {
        role: 'assistant',
        content: '<p>Hi <strong>there</strong></p>',
        status: 'done',
        responseTemplate: 'text',
        text: 'Hi there',
      },
      'New chat',
    );
    store.addExchange(
      conversation.id,
      {
        role: 'assistant',
        content: '<p>Excluded</p>',
        status: 'done',
        included: false,
      },
      'New chat',
    );

    const messages = JSON.parse(
      await useConversationPrompt().buildPrompt(conversation.id),
    );

    expect(messages).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]);
  });

  it('flattens structured assistant data when plain text is absent', async () => {
    const conversation = createConversation('New chat');
    useConversationStore().insertConversation(conversation);
    useConversationStore().addExchange(
      conversation.id,
      {
        role: 'assistant',
        content: '',
        status: 'done',
        responseTemplate: 'article',
        responseData: {
          category: 'Gaming',
          title: 'Neverness to Everness',
          sectionContent: 'An open-world RPG.',
        },
      },
      'New chat',
    );

    const messages = JSON.parse(
      await useConversationPrompt().buildPrompt(conversation.id),
    );

    expect(messages[0].content).toContain('Title: Neverness to Everness');
    expect(messages[0].content).toContain('An open-world RPG.');
  });

  it('reuses the lazy converter across prompt builds', async () => {
    const conversation = createConversation('New chat');
    useConversationStore().insertConversation(conversation);
    useConversationStore().addExchange(
      conversation.id,
      { role: 'user', content: '<h1>Title</h1>', status: 'done' },
      'New chat',
    );
    const prompt = useConversationPrompt();

    const first = await prompt.buildPrompt(conversation.id);
    const second = await prompt.buildPrompt(conversation.id);

    expect(first).toBe(second);
    expect(first).toContain('# Title');
  });

  it('returns an empty array for an unknown conversation', async () => {
    await expect(useConversationPrompt().buildPrompt('missing')).resolves.toBe(
      '[]',
    );
  });
});
