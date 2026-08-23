import { describe, expect, it } from 'vitest';

import { createConversation } from './create-conversation.helper';

describe('createConversation', () => {
  it('applies all defaults when no partial is given', () => {
    const conversation = createConversation();

    expect(conversation).toMatchObject({
      title: 'New chat',
      exchanges: [],
      files: [],
      savedFileInfos: [],
      uploadedImages: [],
      imageSelectionSnapshot: {},
      model: '',
      numCtx: '',
      think: 'medium',
      event: '',
      roomId: '',
      stream: true,
      subscriptions: [],
      type: 'temporary',
    });
    expect(conversation.id).toBeTruthy();
    expect(conversation.conversationId).toBeTruthy();
    expect(conversation.createdAt).toBe(conversation.updatedAt);
  });

  it('applies partial overrides', () => {
    const conversation = createConversation({
      event: 'harness',
      type: 'persistent',
      model: 'model-a',
    });

    expect(conversation.event).toBe('harness');
    expect(conversation.type).toBe('persistent');
    expect(conversation.model).toBe('model-a');
    expect(conversation.stream).toBe(true);
  });
});
