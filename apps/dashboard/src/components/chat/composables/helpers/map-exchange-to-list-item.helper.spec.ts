import { describe, expect, it } from 'vitest';

import { mapExchangeToListItem } from './map-exchange-to-list-item.helper';

describe('mapExchangeToListItem', () => {
  it('maps a user exchange into the list-item shape', () => {
    const result = mapExchangeToListItem(
      {
        id: 'e1',
        role: 'user',
        content: 'hello',
        status: 'done',
        timestamp: 1,
        requestId: 'r1',
      },
      {
        id: 'c1',
        conversationId: 'c1',
        exchanges: [
          {
            id: 'e2',
            role: 'assistant',
            content: 'hi',
            status: 'done',
            timestamp: 2,
            requestId: 'r1',
            inputTokenDelta: 10,
            evalCount: 5,
          },
        ],
      } as never,
      '100',
      { isMergeSelected: () => false },
    );
    expect(result).toMatchObject({
      id: 'e1',
      role: 'user',
      content: 'hello',
      included: true,
      mergeSelected: false,
      merged: false,
      contextPercent: '15.00',
    });
  });
});
