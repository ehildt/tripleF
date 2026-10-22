import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import { createConversation } from './create-conversation.helper';
import { toPersistedConversation } from './to-persisted-conversation.helper';

describe('toPersistedConversation', () => {
  it('carries over every field except the transient files', () => {
    const conversation = createConversation({ event: 'harness' });
    conversation.task = 'summarize';
    conversation.files = [new File(['x'], 'a.png', { type: 'image/png' })];

    const persisted = toPersistedConversation(conversation);

    expect(persisted).not.toHaveProperty('files');
    expect(persisted).toMatchObject({
      id: conversation.id,
      title: conversation.title,
      event: 'harness',
      task: 'summarize',
      conversationId: conversation.conversationId,
    });
    expect(persisted.contextUsagePercent).toBeNull();
  });

  it('stores the context-usage percentage calculated from the exchanges', () => {
    const conversation = createConversation({ numCtx: '1000' });
    conversation.exchanges = [
      {
        id: 'a1',
        role: 'assistant',
        content: 'x',
        status: 'done',
        inputTokenDelta: 100,
        evalCount: 200,
      } as never,
    ];

    expect(toPersistedConversation(conversation).contextUsagePercent).toBe(
      '30.00',
    );
  });

  it('returns a structured-clone-safe snapshot of a REACTIVE conversation', () => {
    // Regression: the store's conversations are Vue-reactive — reading nested
    // fields yields reactive proxies, and Dexie's structured clone rejects
    // them ("[object Array] could not be cloned"), silently dropping every
    // temporary conversation persist since the IndexedDB migration.
    const conversation = reactive(createConversation({ type: 'temporary' }));
    conversation.exchanges.push({
      id: 'e1',
      role: 'user',
      content: 'hello',
      status: 'done',
      conversationId: conversation.conversationId,
    } as never);

    const persisted = toPersistedConversation(conversation);

    expect(() => structuredClone(persisted)).not.toThrow();
    expect(persisted.exchanges[0].content).toBe('hello');
  });
});
