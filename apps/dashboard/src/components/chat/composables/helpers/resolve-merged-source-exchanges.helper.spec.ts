import { describe, expect, it } from 'vitest';

import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';

import { resolveMergedSourceExchanges } from './resolve-merged-source-exchanges.helper';

describe('resolveMergedSourceExchanges', () => {
  it('resolves all source exchange ids and ignores ordinary turns', () => {
    const conversation = createConversation('Chat');
    conversation.exchanges = [
      {
        id: 'origin',
        role: 'user',
        content: 'Origin',
        status: 'done',
        timestamp: 1,
        requestId: 'origin-request',
      },
      {
        id: 'merged',
        role: 'user',
        content: 'Merged',
        status: 'done',
        timestamp: 2,
        requestId: 'merge-request',
        mergeOrigin: ['origin-request'],
      },
    ];

    expect(resolveMergedSourceExchanges(conversation, 'merge-request')).toEqual(
      {
        originRequestIds: ['origin-request'],
        sourceExchangeIds: ['origin'],
      },
    );
    expect(
      resolveMergedSourceExchanges(conversation, 'origin-request'),
    ).toBeNull();
  });
});
