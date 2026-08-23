import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation';

import { computeHighlightedExchangeIds } from './compute-highlighted-exchange-ids.helper';

function user(id: string, requestId?: string): Exchange {
  return {
    id,
    role: 'user',
    content: '',
    status: 'done',
    timestamp: 0,
    requestId,
  };
}

function assistant(id: string, requestId?: string): Exchange {
  return {
    id,
    role: 'assistant',
    content: '',
    status: 'done',
    timestamp: 0,
    requestId,
  };
}

describe('computeHighlightedExchangeIds', () => {
  it('returns an empty set when no id is hovered', () => {
    const exchanges = [user('u1'), assistant('a1', 'r1')];
    expect(computeHighlightedExchangeIds(exchanges, null)).toEqual(new Set());
  });

  it('highlights only the hovered exchange when its id is unknown', () => {
    const exchanges = [user('u1')];
    expect(computeHighlightedExchangeIds(exchanges, 'missing')).toEqual(
      new Set(),
    );
  });

  it('highlights the hovered user exchange alone', () => {
    const exchanges = [user('u1', 'r1'), assistant('a1', 'r2')];
    expect(computeHighlightedExchangeIds(exchanges, 'u1')).toEqual(
      new Set(['u1']),
    );
  });

  it('highlights the hovered user exchange and the matching assistant partner', () => {
    const exchanges = [user('u1', 'r1'), assistant('a1', 'r1')];
    expect(computeHighlightedExchangeIds(exchanges, 'u1')).toEqual(
      new Set(['u1', 'a1']),
    );
  });
});
