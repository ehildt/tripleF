import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation';

import { mapExchangeToListItem } from './map-exchange-to-list-item.helper';

describe('mapExchangeToListItem', () => {
  const userExchange: Exchange = {
    id: 'e1',
    role: 'user',
    content: 'hello',
    status: 'done',
    timestamp: 1,
    requestId: 'r1',
  };

  const assistantExchange: Exchange = {
    id: 'e2',
    role: 'assistant',
    content: 'hi',
    status: 'done',
    timestamp: 2,
    requestId: 'r1',
    inputTokenDelta: 10,
    evalCount: 5,
  };

  it('maps a user exchange into the list-item shape', () => {
    const result = mapExchangeToListItem(
      userExchange,
      'c1',
      '100',
      new Map([['r1', assistantExchange]]),
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

  it('leaves the context percentage undefined without a paired reply', () => {
    const result = mapExchangeToListItem(
      userExchange,
      'c1',
      '100',
      new Map<string, Exchange>(),
      { isMergeSelected: () => false },
    );
    expect(result.contextPercent).toBeUndefined();
    expect(result.mergeSelected).toBe(false);
  });
});
