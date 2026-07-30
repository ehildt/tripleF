import { describe, expect, it } from 'vitest';

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
  });
});
