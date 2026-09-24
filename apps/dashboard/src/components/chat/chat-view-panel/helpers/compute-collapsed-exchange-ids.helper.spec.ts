import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation';

import { computeCollapsedExchangeIds } from './compute-collapsed-exchange-ids.helper';

function user(id: string, included?: boolean, requestId?: string): Exchange {
  return {
    id,
    role: 'user',
    content: '',
    status: 'done',
    timestamp: 0,
    included,
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

describe('computeCollapsedExchangeIds', () => {
  it('returns an empty set when no user exchange is excluded', () => {
    const exchanges = [user('u1', true), assistant('a1', 'r1')];
    expect(computeCollapsedExchangeIds(exchanges)).toEqual(new Set());
  });

  it('collapses a single excluded user exchange without a partner', () => {
    const exchanges = [user('u1', false)];
    expect(computeCollapsedExchangeIds(exchanges)).toEqual(new Set(['u1']));
  });

  it('collapses the excluded user exchange and the matching assistant partner', () => {
    const exchanges = [user('u1', false, 'r1'), assistant('a1', 'r1')];
    expect(computeCollapsedExchangeIds(exchanges)).toEqual(
      new Set(['u1', 'a1']),
    );
  });

  it('does not collapse a partner with a different requestId', () => {
    const exchanges = [user('u1', false, 'r1'), assistant('a1', 'r2')];
    expect(computeCollapsedExchangeIds(exchanges)).toEqual(new Set(['u1']));
  });

  it('leaves subsequent exchanges untouched', () => {
    const exchanges = [
      user('u1', false, 'r1'),
      assistant('a1', 'r1'),
      assistant('a2', 'r2'),
    ];
    expect(computeCollapsedExchangeIds(exchanges)).toEqual(
      new Set(['u1', 'a1']),
    );
  });
});
