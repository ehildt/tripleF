import { describe, expect, it } from 'vitest';

import type { PersistedConversation } from '../../conversation.model';
import { fromPersistedConversation } from './from-persisted-conversation.helper';

function makePersisted(
  overrides?: Partial<PersistedConversation>,
): PersistedConversation {
  return {
    id: 's1',
    title: 'Saved',
    exchanges: [],
    savedFileInfos: [],
    uploadedImages: [],
    conversationId: 'c1',
    model: '',
    numCtx: '',
    think: 'medium',
    event: '',
    roomId: '',
    stream: true,
    createdAt: 1,
    updatedAt: 2,
    ...overrides,
  };
}

describe('fromPersistedConversation', () => {
  it('defaults transient and optional fields', () => {
    const conversation = fromPersistedConversation(makePersisted());

    expect(conversation.files).toEqual([]);
    expect(conversation.imageSelectionSnapshot).toEqual({});
    expect(conversation.subscriptions).toEqual([]);
    expect(conversation.type).toBe('temporary');
  });

  it('marks uploaded images without a selection as selected', () => {
    const conversation = fromPersistedConversation(
      makePersisted({
        uploadedImages: [
          { name: 'a.png', hash: 'ha', uploadedAt: 1, conversationId: 'c1' },
          {
            name: 'b.png',
            hash: 'hb',
            uploadedAt: 1,
            conversationId: 'c1',
            selected: false,
          },
        ],
      }),
    );

    expect(conversation.uploadedImages[0].selected).toBe(true);
    expect(conversation.uploadedImages[1].selected).toBe(false);
  });
});
